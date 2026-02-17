import sqlite3
import pickle
import numpy as np
from fastapi import HTTPException

STATE_DB = "llm/sql/state.db"

class StateDB:
  """Создаем бд, делаем запросы, обновляем столбцы"""
  def __init__(self):
    self.con = sqlite3.connect(STATE_DB)
    self.cur = self.con.cursor()

    self.cur.execute("""
      CREATE TABLE IF NOT EXISTS people_state (name TEXT, age INT, profession TEXT, gender TEXT,
       anger INT, joy INT, neutral INT, weather TEXT, mobs BOOLEAN)
        """)
    self.con.commit()

  def save_person(self, person):
    self.cur.execute("""INSERT OR REPLACE INTO people_state VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""", (person.name, person.age, person.profession,
                                                          person.gender, person.anger, person.joy, person.neutral, person.weather, person.mobs))
    self.con.commit()

  def update_environment(self, name, weather, mobs):
    self.cur.execute("""UPDATE people_state SET weather = ?, mobs = ? WHERE name = ?""", (weather, mobs, name))
    self.con.commit()

MEMORY_DB = "llm/sql/memory.db"

class MemoryDB:
  """Создаем векторую бд, столбец vector представляя в типе данных для хранения больших объемов двоичных данных,
  далее добовляем в память объект строку в байтах, затем добавляя ее в таблицу.
  Метод search делает запрос в векторную бд, при помощи loads читаем объект и преобразуем его в исходный вид,
  затем выводим 5 самых близких по значению векторов.
  При помощи cosine вычисляем сходство в векторах при помощи косинусового сходства"""
  def __init__(self):
    self.con = sqlite3.connect(MEMORY_DB)
    self.cur = self.con.cursor()
    try:
      self.cur.execute("""CREATE TABLE IF NOT EXISTS memories (id INTEGER PRIMARY KEY AUTOINCREMENT, npc_name TEXT, event_text TEXT, vector BLOB)""")
      self.con.commit()
    except:
      raise HTTPException(status_code=500, detail='Ошибка при работе с базой даннных')

  def add_memory(self, npc_name, text, vector):
    blob = pickle.dumps(vector)
    try:
      self.cur.execute("""INSERT INTO memories (npc_name, event_text, vector) VALUES (?, ?, ?)""", (npc_name, text, blob))
      self.con.commit()
    except:
      raise HTTPException(status_code=500, detail='Ошибка при работе с базой данных')

  def search(self, npc_name, query_vector, k=5):
    try:
      self.cur.execute("""SELECT event_text, vector FROM memories WHERE npc_name = ?""", (npc_name,))
      rows = self.cur.fetchall()
    except:
      raise HTTPException(status_code=500, detail='Ошибка при работе с базой данных')
    results = []

    for text, blob in rows:
      vec = pickle.loads(blob)
      sim = self.cosine(query_vector, vec)
      results.append((sim, text))

    results.sort(reverse=True)
    return results[:k]

  def cosine(self, a, b):
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b) + 1e-8) #Вычисляем сходство в векторах
