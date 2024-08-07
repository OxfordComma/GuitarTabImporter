"use client"
export function SignInButton({ signInAction, styles }) {
  return (
    <div className={styles['button-container']}>
      <button className={styles['sign-in-button']} key='button' onClick={() => signInAction()}>Sign In</button>
    </div>
  )
}