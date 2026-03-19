import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="min-h-[80vh] flex items-center justify-center p-6 bg-slate-950">
      <div className="relative group">
        {/* Efecto de brillo de fondo para que resalte el formulario */}
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-emerald-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
        
        <div className="relative">
          <SignIn 
            appearance={{
              elements: {
                formButtonPrimary: 'bg-blue-600 hover:bg-blue-500 text-sm normal-case font-bold',
                card: 'bg-slate-900 border border-slate-800 shadow-2xl rounded-2xl',
                headerTitle: 'text-white font-black italic uppercase tracking-tighter',
                headerSubtitle: 'text-slate-400 font-bold',
                socialButtonsBlockButton: 'bg-slate-950 border-slate-800 text-white hover:bg-slate-800',
                dividerLine: 'bg-slate-800',
                dividerText: 'text-slate-500',
                formFieldLabel: 'text-slate-300 font-bold uppercase text-[10px] tracking-widest',
                formFieldInput: 'bg-slate-950 border-slate-800 text-white focus:border-blue-500',
                footerActionText: 'text-slate-400',
                footerActionLink: 'text-blue-500 hover:text-blue-400 font-bold',
              }
            }}
          />
        </div>
      </div>
    </main>
  );
}
