import Image from "next/image";
import styles from "./Viewport.module.css";

export function Viewport() {
  return (
    <section className={styles.viewport}>
      <div className={styles.mapInfoBar}>
        <p className={styles.mapName}>WHISPERING VILLAGE</p>
        <div className={styles.mapMeta}>
          <span>REGION: NORTH FRONTIER</span>
          <span>POPULATION: LOW</span>
        </div>
      </div>

      <div className={styles.mapFrame}>
        <Image
          src="/images/world.gif"
          alt="VWorld village map"
          fill
          unoptimized
          draggable={false}
          className={styles.map}
        />
      </div>
    </section>
  );
}
