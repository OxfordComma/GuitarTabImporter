"use client"
import { useState } from "react"
// import { signIn } from "auth.js"
 
export function SignInButton({ signInAction }) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  return (
    <form
      action={() => signInAction(email, password)}
    >
      {/*<label>
        Email
        <input
          name="email"
          type="email"
          onChange={(e) => setEmail(e.target.value)}
          value={email}
        />
      </label>*/}
      {/*<label>
        Password
        <input
          name="password"
          type="password"
          onChange={(e) => setPassword(e.target.value)}
          value={password}
        />
      </label>*/}
      <button type="submit">Sign In</button>
    </form>
  )
}