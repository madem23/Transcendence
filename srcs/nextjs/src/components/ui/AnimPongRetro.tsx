import React from 'react';
import styles from '@/styles/AnimPong.module.css';

const AnimPongRetro: React.FC = () => {
  return (
    <div className={styles.field}>
      <div className={styles.net}></div>
      <div className={styles.ping}></div>
      <div className={styles.pong}></div>
      <div className={styles.ball}></div>
    </div>
  );
};

export default AnimPongRetro;
  