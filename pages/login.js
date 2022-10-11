import Header from '../components/Header.js'
import styles from '../styles/login.module.css'
import { useSession, signIn, signOut } from "next-auth/react"

export default function Login(props) {
  const { data: session, status } = useSession()
  console.log('sesssion:', session)
  console.log('status:', status)
  
	return (
	<div className={styles.container}>
		<main className={styles.main}>
			<div className={styles.content}>Guitar Tab Importer</div>
		</main>
	</div>)
}

