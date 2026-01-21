# extract_hospitals.py
import pandas as pd

# 🔹 Charger le CSV
df = pd.read_csv("data/healthcare_dataset.csv")

# 🔹 Extraire les hôpitaux distincts
distinct_hospitals = df["Hospital"].dropna().unique()

# 🔹 Afficher
print("Hôpitaux distincts :")
for hospital in distinct_hospitals:
    print(hospital)

# 🔹 Facultatif : sauvegarder dans un fichier texte
with open("distinct_hospitals.txt", "w", encoding="utf-8") as f:
    for hospital in distinct_hospitals:
        f.write(hospital + "\n")
