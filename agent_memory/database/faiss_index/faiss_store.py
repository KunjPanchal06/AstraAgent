import faiss
import numpy as np #FAISS expects numerical arrays in a suitable format.


class FAISSStore:
#FAISSStore handles how those memories are searched using vectors.
    def __init__(self, dimension):
#IndexFlatL2 performs a similarity search using L2 / Euclidean distance.
        self.index = faiss.IndexFlatL2(dimension)

        self.memories = []

    def add_vector(self, vector, memory):

        vector = np.array(vector, dtype="float32")

        vector = vector.reshape(1, -1)

        self.index.add(vector)

        self.memories.append(memory)

    def search(self, vector, k=1):

        vector = np.array(vector, dtype="float32")

        vector = vector.reshape(1, -1)

        distances, indices = self.index.search(vector, k)

        results = []

        for index in indices[0]:

            results.append(self.memories[index])

        return distances, results

    # embedding faiss --->vectordb
    #knowledge file