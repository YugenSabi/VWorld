from random import choice
from create_people import init_people
from embedding import EmbeddingsModel


list_standart_phrase = ['Привет', 'Доброго времени суток', 'Приветсвую', 'Здравствуй', 'Здравствуйте',
                        'Ку-ку', 'Прив', 'Привет, как дела?', 'Привет, гуляешь?', 'Привет как тебя зовут, извини если забыл']

def start_work_nps():
  npc_1 = init_people()
  npc_2 = init_people()

  embedding = EmbeddingsModel()

  world_state = {'weather': 'ясно', 'mobs': False}
  message_1 = f"{npc_1.name} говорит: {choice(list_standart_phrase)}"
  response_1 = npc_2.talk(message_1, world_state, embedding)
  print(f"{npc_2.name} ответил: {response_1}")

  world_state = {'weather': 'ясно', 'mobs': False}
  message_2 = f"{npc_2.name} говорит: {choice(list_standart_phrase)}"
  response_2 = npc_1.talk(message_2, world_state, embedding)
  print(f"{npc_1.name} ответил: {response_2}")


if __name__ == '__main__':
  start_work_nps()
