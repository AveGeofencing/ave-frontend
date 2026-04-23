import React, { ReactElement } from "react";

function Modal(props: {
  show: boolean;
  modalClosed: () => void;
  children: ReactElement;
}) {
  return (
    <>
      <div
        className="fixed min-h-screen z-[2000] top-0 left-0 backdrop-brightness-[.2] w-full h-screen px-16 flex justify-center items-center"
        style={{
          transform: props.show ? "translateY(0)" : "translateY(-100vh)",
          opacity: props.show ? "1" : "0",
        }}
      >
        <div
          className="
          relative p-4 w-full sm:p-6 bg-white rounded-lg dark:bg-gray-900 border-2 border-black
          sm:w-[400px]
        "
        >
          <button
            className="absolute top-6 right-6"
            onClick={props.modalClosed}
          >
            Close
          </button>
          <div className="pt-6">{props.children}</div>
        </div>
      </div>
    </>
  );
}

export default Modal;
