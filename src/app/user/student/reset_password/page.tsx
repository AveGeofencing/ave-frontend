"use client";
import React, {useState, useEffect, useRef, Suspense} from 'react';
import { useSearchParams } from 'next/navigation';
import OpenModal from '@/components/OpenModal/OpenModal';
import Image from 'next/image';
import { FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import api from "@/lib/api";

const Page = () => {
    let token:string;
    const searchParams = useSearchParams();
    const router = useRouter();
    const [showSuccessModal, updateShowSuccessModal] = useState(false);
    const [loading, updateLaoding] = useState(false);
    const [error, updateError] = useState({state: false, message: ""});

    const passwordRef = useRef<HTMLInputElement>(null);

const Spinner = (    
        <div role="status">
            <svg aria-hidden="true" className="inline w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-white" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
                <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
            </svg>
            <span className="sr-only">Loading...</span>
        </div>
    );
    
    useEffect(() => {
        // Get token from URL Parameters
        const search = searchParams.get("token");
        token = (search as string);
    });

    const handleResetPassword = async (e:FormEvent) => {
        // get password value
        const password = (passwordRef.current as HTMLInputElement).value;
        console.log(password, token);

        if (password === "" && password.length < 5) {
            updateError({state: true, message: "Password must be at least 5 characters"});
            return;
        } 

        updateError({state: false, message: ""});
        updateLaoding(true);
        
        // call the reset password endpoint
        try {
            const response = await api.post("/user/reset_password", {}, {
                headers: {
                    "Content-Type": "application/json"
                },
                params: {
                    "new_password": password,
                    "token": token
                }
            });

            console.log(response);
            updateShowSuccessModal(true);
        } catch (error:any) {
            console.log(error);
            updateShowSuccessModal(false);
            updateError({state: true, message: "Password reset link has expired. Please request for a new one."});

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
            updateLaoding(false);
        }
    }

    return (
        <div id='reset-password-page' className='flex flex-col gap-5 p-12 min-h-screen dark:bg-gray-900  dark:text-gray-400'>
            <OpenModal hidden={!showSuccessModal}>
                <div className='flex flex-col gap-5 items-center p-8 text-center dark:bg-gray-800 dark:text-gray-300'>
                    <Image src={"/success.svg"}  className="mx-auto mt-5" width={100} height={100} alt="Success-Icon"/>
                    <h1 className="font-extrabold text-lg text-center dark:text-gray-200"> Congratulations <br /> Your password has been reset successfully!</h1>
                    <p className='text-sm'>You can login with the new password now</p>
                    <button className="py-2 mt-8 px-4 w-full border rounded cursor-pointer
                        transition duration-300 ease-out hover:border-green-600 hover:text-green-500" 
                        onClick={() => {
                            updateShowSuccessModal(false);
                            router.push("/");
                        }}
                    >
                    Proceed to login
                    </button>
                </div>
            </OpenModal>

            <div>
                <h1 className='text-2xl text-gray-600 text-center my-2 sm:text-3xl font-extrabold dark:text-gray-300'>Enter your new desired password.</h1>
                <p className='text-xs text-center'>Once completed, your account will use this new password</p>
            </div>

            <form onSubmit={(e:FormEvent) => {e.preventDefault(); handleResetPassword(e)}} className='flex flex-col justify-around'>
                <input type='password' ref={passwordRef} className='input' placeholder='Enter your new password' />
                {error.state && <p className='text-red-500 font-bold text-sm'>{error.message}</p>}
                <button className='my-4 p-2 w-full bg-purple-600 text-center rounded text-white transition duration-300 ease-out hover:shadow-lg disabled:opacity-60 dark:bg-purple-700 dark:hover:bg-purple-800' disabled={loading}>
                    {loading? Spinner: "Submit"}
                </button>
            </form>
        </div>
    );
}

export default Page;
