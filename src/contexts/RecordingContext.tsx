import { createContext, useContext, useState, useMemo } from "react";

interface RecordingContextType {
  isRecording: boolean;
  setIsRecording: (isRecording: boolean) => void;
}

const RecordingContext = createContext<RecordingContextType | undefined>(
  undefined
);

export const useRecording = () => {
  const context = useContext(RecordingContext);
  if (context === undefined) {
    // This is a graceful fallback for parts of the app outside the studio
    return { isRecording: false, setIsRecording: () => {} };
  }
  return context;
};

export const RecordingProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [isRecording, setIsRecording] = useState(false);

  const value = useMemo(() => ({ isRecording, setIsRecording }), [isRecording]);

  return (
    <RecordingContext.Provider value={value}>
      {children}
    </RecordingContext.Provider>
  );
};
