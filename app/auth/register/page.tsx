import { Suspense } from "react"
import { RegisterForm } from "@/components/auth/register-form"

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-sky-50 via-blue-50 to-white p-4 sm:p-6">
      <Suspense fallback={<div className="text-sm text-gray-600">Preparing form...</div>}>
        <RegisterForm />
      </Suspense>
    </div>
  )
}