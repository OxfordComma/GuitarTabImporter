import Header from '../components/Header.js'
import styles from '../styles/login.module.css'
import { useSession, signIn, signOut } from "next-auth/react"
import { useEffect } from 'react'
import { useRouter } from 'next/router'

export default function Login(props) {
	const router = useRouter()
  const { data: session, status } = useSession()
  
  useEffect(() => {
    if (status == 'authenticated') {
      router.push('/edit')
    }
  }, [status])

  return (
	<div className={styles['container']}>
		<main className={styles['main']}>
			<div className={styles['content']}>Guitar Tab Importer</div>
		</main>	
	</div>)
}

