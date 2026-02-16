import Image from "next/image";
import styles from "./Viewport.module.css";

export function Viewport() {
  return (
    <section className={styles.mapFrame}>
      <Image
        src="/world.gif"
        alt="VWorld village map"
        fill
        unoptimized
        draggable={false}
        className={styles.map}
      />
    </section>
  );
}
