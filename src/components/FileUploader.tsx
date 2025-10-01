interface FileUploaderProps {
  itineraryId: string; // ⬅️ Ajoutez cette prop
  // ... autres props
}

export default function FileUploader({ itineraryId }: FileUploaderProps) {
  // Maintenant vous pouvez utiliser itineraryId dans handleFileUpload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // ... code avec itineraryId
  };
}