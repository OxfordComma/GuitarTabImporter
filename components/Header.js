import styles from '../styles/Header.module.css'
import Link from 'next/link'


export default function Header ({ 
  headings = {'Home': '/home'},
}) {

	return (
    <div className={styles['header']}>
      {
        Object.keys(headings).map(h => <div key={h} className={styles['header-item']}>
          <Link key={h} onClick={() => {}} legacyBehavior={false} href={headings[h]}>{h}</Link>
        </div>)
      }
    </div>	
	)
}