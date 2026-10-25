import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { Monitor, Smartphone } from "lucide-react";
import styles from "./auth.module.css";

const BRASAO_SRC = "/images/brasao.png";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className={styles.shell}>
      <aside className={styles.brandPanel} aria-label="Sobre o SIPAT">
        <div className={styles.brandTop}>
          <Link className={styles.brand} href="/login">
            <span className={styles.brandIcon}>
              <Image
                className={styles.brandLogo}
                src={BRASAO_SRC}
                alt=""
                width={89}
                height={90}
              />
            </span>
            <span>SIPAT</span>
          </Link>
          <p className={styles.brandCaption}>Sistema de Gestão Patrimonial</p>
        </div>
        <div className={styles.brandBody}>
          <p className={styles.brandTitle}>
            Gestão patrimonial
            <br />
            da Câmara.
          </p>
          <p className={styles.brandDescription}>
            Consulte os bens, acompanhe as operações
            <br />e preserve o histórico de cada item.
          </p>
          <div className={styles.deviceNote}>
            <div className={styles.deviceHeading}>
              <span className={styles.deviceIcons}>
                <Monitor size={19} aria-hidden="true" />
                <Smartphone size={18} aria-hidden="true" />
              </span>
              <strong>No computador ou no celular</strong>
            </div>
            <p>A mesma conta e os mesmos dados do SIPAT.</p>
          </div>
        </div>
        <div className={styles.cityFooter}>
          <span className={styles.cityMark}>
            <Image
              className={styles.cityLogo}
              src={BRASAO_SRC}
              alt=""
              width={89}
              height={90}
            />
          </span>
          <div>
            <strong>Câmara Municipal de Patos de Minas</strong>
            <span>Gestão do patrimônio público</span>
          </div>
        </div>
      </aside>
      <section className={styles.content} aria-label="Acesso ao SIPAT">
        <div className={styles.mobileBrand}>
          <span className={styles.brandIcon}>
            <Image
              className={styles.brandLogo}
              src={BRASAO_SRC}
              alt=""
              width={89}
              height={90}
            />
          </span>
          SIPAT
        </div>
        <div className={styles.contentInner}>
          {children}
          <p className={styles.pageSignature}>
            SIPAT · Câmara Municipal de Patos de Minas
          </p>
        </div>
      </section>
    </main>
  );
}
