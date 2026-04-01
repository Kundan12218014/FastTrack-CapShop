import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import { signupSchema, type SignupFormData } from "../schemas/authSchemas";
import { useAuth } from "../hooks/useAuth";
import { ROUTES } from "../../../constants/routes";

export const SignupPage = () => {
  const { handleSignup, loading, error } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({ resolver: zodResolver(signupSchema) });

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Create account</h1>
        <p className="text-sm text-gray-500 mb-6">Join CapShop and start shopping</p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(handleSignup)} noValidate className="space-y-4">
          {[
            { name: "fullName",    label: "Full name",    type: "text",     autocomplete: "name" },
            { name: "email",       label: "Email address",type: "email",    autocomplete: "email" },
            { name: "phoneNumber", label: "Phone number", type: "tel",      autocomplete: "tel" },
            { name: "password",    label: "Password",     type: "password", autocomplete: "new-password" },
          ].map(({ name, label, type, autocomplete }) => (
            <div key={name}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
              <input
                type={type}
                autoComplete={autocomplete}
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none
                  focus:ring-2 focus:ring-blue-500 transition
                  ${errors[name as keyof SignupFormData] ? "border-red-400" : "border-gray-300"}`}
                {...register(name as keyof SignupFormData)}
              />
              {errors[name as keyof SignupFormData] && (
                <p className="mt-1 text-xs text-red-600">
                  {errors[name as keyof SignupFormData]?.message}
                </p>
              )}
            </div>
          ))}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium
              hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link to={ROUTES.LOGIN} className="text-blue-600 hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignupPage;