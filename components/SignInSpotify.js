'use server'
import { signIn } from "auth.js"

export async function signInAction() {
  return await signIn("spotify", { redirectTo: '/profile' })
}

// export async function SignInButtonSpotify({ signInAction, styles }) {
//   return (
//     <div className={styles['button-container']}>
//       <button className={styles['sign-in-button']} key='button' onClick={() => signInAction()}>Sign In</button>
//     </div>
//   )
// }