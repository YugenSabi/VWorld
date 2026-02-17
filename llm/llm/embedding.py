from langchain_community.embeddings import HuggingFaceEmbeddings


class EmbeddingsModel():
  """Преобразуем текст при помощи эмбеддингов в векторное предстваление для
  быстрого поиска инфы по ключевым словам
  """
  def __init__(self):
    self.model = HuggingFaceEmbeddings(model_name='sentence-transformers/all-MiniLM-L6-v2')

  def embed(self, text: str):
    return self.model.embed_query(text)
