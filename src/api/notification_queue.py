import threading
from datetime import datetime, timedelta, timezone
from uuid import uuid4


class NotificationQueue:
    _instance = None
    _singleton_lock = threading.Lock()

    def __new__(cls):
        if cls._instance is None:
            with cls._singleton_lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
                    cls._instance._store = {}
                    cls._instance._mutex = threading.Lock()
        return cls._instance

    def push(self, user_type, user_id, notification_type, title, message, appointment_id=None):
        notification = {
            "id": str(uuid4()),
            "user_type": user_type,
            "user_id": user_id,
            "appointment_id": appointment_id,
            "notification_type": notification_type,
            "title": title,
            "message": message,
            "is_read": False,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        key = f"{user_type}:{user_id}"
        with self._mutex:
            if key not in self._store:
                self._store[key] = []
            self._store[key].append(notification)
        return notification

    def list_for_user(self, user_type, user_id):
        self._cleanup()
        key = f"{user_type}:{user_id}"
        with self._mutex:
            return list(reversed(self._store.get(key, [])))

    def mark_read(self, notification_id):
        with self._mutex:
            for notifications in self._store.values():
                for n in notifications:
                    if n["id"] == notification_id:
                        n["is_read"] = True
                        return True
        return False

    def mark_all_read(self, user_type, user_id):
        key = f"{user_type}:{user_id}"
        with self._mutex:
            notifications = self._store.get(key, [])
            count = sum(1 for n in notifications if not n["is_read"])
            for n in notifications:
                n["is_read"] = True
            return count

    def unread_count(self, user_type, user_id):
        key = f"{user_type}:{user_id}"
        with self._mutex:
            return sum(1 for n in self._store.get(key, []) if not n["is_read"])

    def _cleanup(self):
        cutoff = datetime.now(timezone.utc) - timedelta(hours=24)
        with self._mutex:
            expired = []
            for key, notifications in self._store.items():
                self._store[key] = [
                    n for n in notifications
                    if datetime.fromisoformat(n["created_at"]) > cutoff
                ]
                if not self._store[key]:
                    expired.append(key)
            for key in expired:
                del self._store[key]
