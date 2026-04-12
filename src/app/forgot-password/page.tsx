"use client";
import React, {useState, useRef, FormEvent} from 'react';
import api from "@/lib/api";
import OpenModal from '@/components/OpenModal/OpenModal';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

const Page = () => {
    const [loading, updateLoading] = useState(false);
    const [error, updateError] = useState({state: false, message: ""});
    const [showSuccessModal, updateShowSuccessModal] = useState(false);

    const router = useRouter();

    const emailInputRef = useRef<HTMLInputElement>(null);
    const Spinner = (    
        <div role="status">
            <svg aria-hidden="true" className="inline w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-white" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
                <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
            </svg>
            <span className="sr-only">Loading...</span>
        </div>
    )

    const handleForgotPassword = async (e:FormEvent) => {
        e.preventDefault();
        const emailInput: string = (emailInputRef.current as HTMLInputElement).value;
        const regex = /^[a-zA-Z0-9]+([.-_][a-zA-Z0-9]+)*@[a-zA-Z0-9]+([-.][a-zA-Z0-9]+)*\.[a-zA-Z]{2,}$/; // Email Regex

        // make sure email input is present
        if (emailInput == "" || !emailInput.match(regex)) {
            // update error message and cancel request
            updateError({state: true, message: "Please write out a valid email."});
            return
        };

        // restore error state
        updateError({state: false, message: ""});
        
        updateLoading(true);
        // make forgot password request
        try {
            const response = await api.post("/user/forgot_password", {}, {
              headers: {
                  "Content-Type": "application/json",
              },
              params: {
                  "student_email": emailInput
              }
          });

            console.log(response);
            updateShowSuccessModal(true);
        } catch (error: any) {
            console.log(error);
            updateShowSuccessModal(false);
            updateError({state: true, message: "Session token has expired."});

            if (error.status == 500) {
                updateError({state: true, message: "An error occured, contact Admin courageadedara@gmail.com"});
                return;
            }

            if (error.status == 401 && error.response.data.detail.toLowerCase().includes("session")) {
                // Session has expired, Redirect to the login page
                localStorage.removeItem("token");
                localStorage.removeItem("student_token");

                router.push("/");
            }
        } finally {
            updateLoading(false);
        }
    }

    return (
        <div id='forgot-password-page' className='flex flex-col gap-5 p-12 min-h-screen dark:bg-gray-900 dark:text-gray-400'>
            <OpenModal hidden={!showSuccessModal}>
                <div className='flex flex-col gap-5 items-center p-8 text-center dark:bg-gray-800 dark:text-gray-300'>
                    <Image src={"/success.svg"}  className="mx-auto mt-5" width={100} height={100} alt="Success-Icon"/>
                    <h1 className="font-extrabold text-lg text-center dark:text-gray-100"> A mail has been sent to your specified email successfully!</h1>
                    <p className='text-sm'>Click the link from your mail to reset password</p>
                    <button className="py-2 mt-8 px-4 w-full border rounded cursor-pointer
                        transition duration-300 ease-out hover:border-green-600 hover:text-green-500" 
                        onClick={() => {
                            updateShowSuccessModal(false);
                        }}
                    >
                       <a href="https://www.google.com/search?q=google+mail&oq=google+mail&gs_lcrp=EgZjaHJvbWUqDggAEEUYJxg7GIAEGIoFMg4IABBFGCcYOxiABBiKBTIHCAEQABiABDIHCAIQABiABDIHCAMQABiABDIHCAQQABiABDIHCAUQABiABDIHCAYQABiABDIGCAcQRRg80gEINjQ3NWoxajeoAgCwAgA&sourceid=chrome&ie=UTF-8">Go to mail.</a>
                    </button>
                </div>
            </OpenModal>

            <div>
                <h1 className='text-2xl text-gray-600 text-center my-2 sm:text-3xl font-extrabold dark:text-gray-300'>Enter your account&apos;s email address</h1>
                <p className='text-xs text-center'>A link would be sent to your email for password reset</p>
            </div>

            <form onSubmit={(e:FormEvent) => {e.preventDefault(); handleForgotPassword(e)}} className='flex flex-col justify-around'>
                <input type='email' ref={emailInputRef} className='input' placeholder='Enter your email address' />
                {error.state && <p className='text-red-500 font-bold text-sm'>{error.message}</p>}
                
                <button 
                    className='my-4 p-2 w-full bg-purple-600 text-center rounded text-white transition duration-300 ease-out hover:shadow-lg disabled:opacity-60 dark:bg-purple-700 dark:hover:bg-purple-800' 
                    disabled={loading}
                >
                    {loading? Spinner: "Submit"}
                </button>
            </form>
        </div>
    );
}

export default Page;
