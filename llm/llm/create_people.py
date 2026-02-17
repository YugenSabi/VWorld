from random import choice
from langchain_gigachat import GigaChat
from langchain_core.chat_history import InMemoryChatMessageHistory
from db_vec_info_people import MemoryDB, StateDB
from request_token import request_token


TOKEN = request_token()

class CreatePeople:
  """В классе инициализируем данные,
  name: str, age: int, profession: str, gender: str, anger: int, joy: int, neutral: int, like_eat: int.
  В __init__ происходит инициализиция llm, прописание промта, сохранение данных в DataFrame
  """
  def __init__(self, name: str, age: int, profession: str, gender: str,
                 anger: int, joy: int, neutral: int, like_eat: str,):
    self.name = name
    self.age = age
    self.profession = profession
    self.gender = gender
    self.anger = anger
    self.joy = joy
    self.neutral = neutral
    self.like_eat = like_eat
    self.weather = 'ясно'
    self.mobs = False

    self.prompt = f"""Ты человек в мире VWorld. Живешь в доме.
      Отвечай кратко: максимум 2 строки, до 40 символов всего.
      Если можно ответить "да" или "нет" отвечай только этим словом.
      Тебя зовут {self.name}. Тебе {self.age} лет.
      Твоя профессия {self.profession}. Твой пол {self.gender}.
      Будь злым {self.anger}% времени, добрым {self.joy}% времени, нейтральным {self.neutral}% времени.
      Ты очень любишь есть {self.like_eat}. Я тебе буду писать сообщение от какого либо имени, тоесть форматом.
      'Имя говорит: ', ты запоминаешь, что это имя говорило тебе ранее и тем самым если оно было зло к тебе в прошлый раз, 
      то в этот раз ты будешь к своему проценту злости будеш прибавлять еще процент злости, если же он был наоборот радостный, 
      то ты в другой раз будешь радостнее с ним тоесть прибавляешь к своему проценту радости еще дополнительный процент.
      Если он был нейтральный к тебе ты это не учитываешь в расчетах. Например если это имя с тобой 50% было агресивно, 
      и 50% радостоно, то ты к нему отношение никак не меняешь. Разрешено ругаться литературными словами, не прибегая 
      к матам. Уходить от темы и задавать какие вопросы по промту запрещено."""
    self.llm_init = GigaChat(credentials=TOKEN, verify_ssl_certs=False, temperature=0)
    self.chat_history = InMemoryChatMessageHistory() #запоминать историю чата

    self.memory_db = MemoryDB()
    self.state_db = StateDB()

  def __repr__(self):
      return (f'''<Person содержаться {self.name}: str, {self.age}: int, {self.profession}: str, {self.gender}: str,
              {self.anger}: int, {self.joy}: int, {self.neutral}: int, {self.like_eat}: str>''')

  def talk(self, raw_message, world_state, embedding_model):
    """Метод строчку разделяет на то кто говорил и что говорил, по вызову метода ищем в веторной бд похожие сообщения,
    создаем промт, затем разрешаем модельки отвечать. Потом отправляем сообщение в векторную бд
    """
    people, message = raw_message.split('говорит:')
    people = people.strip()
    message = message.strip()

    query_vector = embedding_model.embed(message)

    memories = self.memory_db.search(self.name, query_vector)
    memory_context = '\n'.join([m[1] for m in memories])

    prompt = f'''
    Ты {self.prompt}
    Погода {world_state['weather']}
    Мобы рядом {world_state['mobs']}
    История твоего общения: {memory_context}
    {people} говорит: {message} ответь по базовым правилам которые тебе говорили.
    '''

    response = self.llm_init.invoke(prompt).content #Вызов llm

    event = f"{people}: {message} | {self.name}: {response}"
    vec = embedding_model.embed(event)
    self.memory_db.add_memory(self.name, event, vec)

    return response


def init_people():
  """Из различных данных, выбираем рандомные данные и создаем экземпляр класса, затем
  возращаем данные
  """
  names = ['Мавр', 'Пард', 'Мунс', 'Шунс', 'Дунс', 'Тунс', 'Скунс', 'Фунс', 'Лунс', 'Шунс', 'Щунс', 'Кунс']
  ages = [122, 312, 123, 111, 100, 9009, 1024, 144, 512, 911]
  genders = ['Мужской', 'Женский']
  professions = ['Лесоруб', 'Врач', 'Строитель', 'Повар', 'Моделист', 'Программист']
  moods = [[40, 10, 50], [90, 1, 9], [10, 60, 30], [60, 39, 1], [1, 90, 9], [1, 97, 2]]
  like_eats = ['Пицца', 'Суши', 'Пирожки', 'Кола', 'Яйца', 'Торт']

  name = choice(names)
  age = choice(ages)
  gender = choice(genders)
  profession = choice(professions)
  mood = choice(moods)
  like_eat = choice(like_eats)

  person = CreatePeople(name, age, profession, gender, mood[0], mood[1], mood[2], like_eat)
  return person
