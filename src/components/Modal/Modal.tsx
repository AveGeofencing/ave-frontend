import React, { ReactElement } from "react";

function Modal(props: {
  show: boolean;
  modalClosed: () => void;
  children: ReactElement;
}) {
  return (
    <>
      <div
        className="fixed z-[2000] top-0 left-0 backdrop-brightness-[.2] w-full h-screen flex justify-center items-center"
        style={{
          transform: props.show ? "translateY(0)" : "translateY(-100vh)",
          opacity: props.show ? "1" : "0",
        }}
      >
        <div
          className="
          relative flex justify-center items-center p-4 w-full h-screen sm:p-6 bg-white dark:bg-gray-900 border-2 border-black
          sm:w-[400px] sm:h-[350px] sm:rounded-lg
        "
        >
          <button
            className="absolute top-6 right-6 hover:cursor-pointer"
            onClick={props.modalClosed}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              width="24"
              height="24"
            >
              <circle cx="12" cy="12" r="12" fill="#e5e7eb" />
              <path
                d="M7 7L17 17M17 7L7 17"
                stroke="#111827"
                stroke-width="2"
                stroke-linecap="round"
              />
            </svg>
          </button>
          <div className="pt-6">{props.children}</div>
        </div>
      </div>
    </>
  );
}

export default Modal;
