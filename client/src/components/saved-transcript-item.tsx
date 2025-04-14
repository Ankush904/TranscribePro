import { formatDistanceToNow } from 'date-fns';
import { Transcript } from '@shared/schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, Edit, ExternalLink, MessageSquare } from 'lucide-react';
import { formatDuration } from '@/lib/utils';
import { Link } from 'wouter';

interface SavedTranscriptItemProps {
  transcript: Transcript;
  onDelete: () => void;
}

export default function SavedTranscriptItem({ transcript, onDelete }: SavedTranscriptItemProps) {
  // Format the created date
  const createdDate = transcript.createdAt 
    ? formatDistanceToNow(new Date(transcript.createdAt), { addSuffix: true })
    : 'Unknown date';
  
  // Get the excerpt from the transcript text
  const excerpt = transcript.text.length > 150 
    ? transcript.text.substring(0, 150) + '...' 
    : transcript.text;
  
  return (
    <Card className="bg-gray-800 border-none shadow-lg group">
      <CardHeader className="pb-2 flex flex-row justify-between items-center">
        <CardTitle className="text-lg font-medium text-white">{transcript.title}</CardTitle>
        
        <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-gray-300"
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-gray-300 text-sm mb-4 whitespace-pre-line">{excerpt}</p>
        
        <div className="flex flex-wrap justify-between items-center">
          <div className="text-xs text-gray-400 space-x-2">
            <span>{formatDuration(transcript.duration)}</span>
            <span>•</span>
            <span>{transcript.wordCount} words</span>
            <span>•</span>
            <span>{createdDate}</span>
          </div>
          
          <div className="flex space-x-2 mt-2 sm:mt-0">
            <Button 
              variant="outline" 
              size="sm"
              className="text-xs bg-gray-700 border-gray-600 hover:bg-gray-600"
              asChild
            >
              <Link href={`/transcript/${transcript.id}`}>
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Link>
            </Button>
            
            <Button 
              variant="primary" 
              size="sm"
              className="text-xs"
              asChild
            >
              <Link href={`/transcript/${transcript.id}`}>
                <ExternalLink className="h-4 w-4 mr-1" />
                Open
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
