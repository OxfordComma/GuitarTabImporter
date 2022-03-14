import Header from '../components/Header.js'
import styles from '../styles/login.module.css'
import { useSession, signIn, signOut } from "next-auth/react"

export default function Login(props) {
  const { data: session, status } = useSession()
  
	return (
	<div className={styles.container}>
		<main className={styles.main}>
			<div className={styles.header}>Guitar Tab Importer</div>
		</main>
	</div>)
}

