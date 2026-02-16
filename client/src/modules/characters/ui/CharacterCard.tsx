import styles from "./CharacterCard.module.css";

interface CharacterCardProps {
  name: string;
  trait: string;
}

export function CharacterCard({ name, trait }: CharacterCardProps) {
  return (
    <div className={styles.card}>
      <div className={styles.avatar} />
      <div className={styles.info}>
        <span className={styles.name}>{name}</span>
        <span className={styles.trait}>{trait}</span>
      </div>
    </div>
  );
}
