import sqlite3
import pickle
import os
import numpy as np

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "vector_memory.db")


class VectorMemoryStore:
    def __init__(self):
        self.con = sqlite3.connect(DB_PATH, check_same_thread=False)
        self.cur = self.con.cursor()
        self.cur.execute("""
            CREATE TABLE IF NOT EXISTS vector_memories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                agent_id INTEGER NOT NULL,
                text TEXT NOT NULL,
                memory_type TEXT DEFAULT 'episode',
                vector BLOB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        self.con.commit()

    def add_memory(self, agent_id: int, text: str, vector, memory_type: str = "episode"):
        blob = pickle.dumps(vector) if vector is not None else None
        self.cur.execute(
            "INSERT INTO vector_memories (agent_id, text, memory_type, vector) VALUES (?, ?, ?, ?)",
            (agent_id, text, memory_type, blob),
        )
        self.con.commit()

    def search(self, agent_id: int, query_vector, k: int = 5) -> list[tuple[float, str]]:
        self.cur.execute(
            "SELECT text, vector FROM vector_memories WHERE agent_id = ? AND vector IS NOT NULL",
            (agent_id,),
        )
        rows = self.cur.fetchall()
        if not rows:
            return []

        results = []
        for text, blob in rows:
            vec = pickle.loads(blob)
            sim = self._cosine(query_vector, vec)
            results.append((sim, text))

        results.sort(reverse=True)
        return results[:k]

    def get_all_memories(self, agent_id: int, memory_type: str = None) -> list[str]:
        if memory_type:
            self.cur.execute(
                "SELECT text FROM vector_memories WHERE agent_id = ? AND memory_type = ? ORDER BY created_at DESC",
                (agent_id, memory_type),
            )
        else:
            self.cur.execute(
                "SELECT text FROM vector_memories WHERE agent_id = ? ORDER BY created_at DESC",
                (agent_id,),
            )
        return [row[0] for row in self.cur.fetchall()]

    def count_memories(self, agent_id: int) -> int:
        self.cur.execute(
            "SELECT COUNT(*) FROM vector_memories WHERE agent_id = ?",
            (agent_id,),
        )
        return self.cur.fetchone()[0]

    def delete_old_episodes(self, agent_id: int, keep_last: int = 10):
        self.cur.execute(
            """DELETE FROM vector_memories
               WHERE agent_id = ? AND memory_type = 'episode'
               AND id NOT IN (
                   SELECT id FROM vector_memories
                   WHERE agent_id = ? AND memory_type = 'episode'
                   ORDER BY created_at DESC LIMIT ?
               )""",
            (agent_id, agent_id, keep_last),
        )
        self.con.commit()

    def _cosine(self, a, b) -> float:
        a = np.array(a)
        b = np.array(b)
        return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b) + 1e-8))


_store_instance = None


def get_memory_store() -> VectorMemoryStore:
    global _store_instance
    if _store_instance is None:
        _store_instance = VectorMemoryStore()
    return _store_instance
