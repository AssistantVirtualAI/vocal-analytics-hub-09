
interface SummaryContentProps {
  isLoading: boolean;
  summary?: string;
  hasTranscript: boolean;
}

export const SummaryContent = ({ 
  isLoading, 
  summary, 
  hasTranscript 
}: SummaryContentProps) => {
  if (isLoading) {
    return (
      <div className="animate-pulse space-y-2">
        <div className="h-4 bg-muted rounded w-full"></div>
        <div className="h-4 bg-muted rounded w-5/6"></div>
        <div className="h-4 bg-muted rounded w-4/5"></div>
      </div>
    );
  }
  
  if (summary) {
    return <p className="whitespace-pre-line">{summary}</p>;
  }
  
  return (
    <p className="text-muted-foreground italic">
      {hasTranscript 
        ? "Cliquez sur \"Générer un résumé\" pour créer un résumé à partir de la transcription."
        : "Aucun résumé ou transcription disponible pour cet appel."}
    </p>
  );
};
