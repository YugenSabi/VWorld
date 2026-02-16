import { CharacterCard } from "./CharacterCard";
import styles from "./CharacterPanel.module.css";

const mockCharacters = [
  { name: "Character 1", trait: "Friendly" },
  { name: "Character 2", trait: "Curious" },
  { name: "Character 3", trait: "Brave" },
];

export function CharacterPanel() {
  return (
    <aside className={styles.panel}>
      <h2 className={styles.title}>CHARACTERS</h2>
      <div className={styles.list}>
        {mockCharacters.map((char) => (
          <CharacterCard key={char.name} name={char.name} trait={char.trait} />
        ))}
      </div>
    </aside>
  );
}
