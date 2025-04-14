import { useEffect, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Mic, Plus, Layers, Settings, CheckCircle, Trash2 } from 'lucide-react';
import { Transcript } from '@shared/schema';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import SavedTranscriptItem from '@/components/saved-transcript-item';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

export default function SavedTranscripts() {
  const [location] = useLocation();
  const { toast } = useToast();
  const [selectedTranscript, setSelectedTranscript] = useState<Transcript | null>(null);

  // Fetch all transcripts
  const { data: transcripts, isLoading, error } = useQuery({
    queryKey: ['/api/transcripts'],
  });

  // Delete transcript mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/transcripts/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Transcript not found');
        }
        throw new Error('Failed to delete transcript');
      }
      
      return id;
    },
    onSuccess: (id) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['/api/transcripts'] });
      
      toast({
        title: 'Transcript deleted',
        description: 'The transcript has been deleted successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Delete failed',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
    },
  });

  const handleDeleteTranscript = (id: number) => {
    deleteMutation.mutate(id);
  };

  return (
    <div className="flex flex-col md:flex-row h-screen">
      {/* Sidebar */}
      <div className="w-full md:w-64 bg-dark-800 p-4 flex flex-col">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-white flex items-center">
            <Mic className="h-6 w-6 mr-2 text-primary" />
            Transcription App
          </h1>
        </div>
        
        <nav className="flex-1">
          <div className="space-y-1">
            <Link href="/">
              <a className={`flex items-center px-2 py-2 text-sm font-medium rounded-md ${location === '/' ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'} group`}>
                <Plus className="h-5 w-5 mr-3 text-gray-400 group-hover:text-primary" />
                New Transcription
              </a>
            </Link>
            
            <Link href="/saved-transcripts">
              <a className={`flex items-center px-2 py-2 text-sm font-medium rounded-md ${location === '/saved-transcripts' ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'} group`}>
                <Layers className="h-5 w-5 mr-3 text-primary" />
                Saved Transcripts
              </a>
            </Link>
            
            <a href="#" className="flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-300 hover:bg-gray-700 hover:text-white group">
              <Settings className="h-5 w-5 mr-3 text-gray-400 group-hover:text-primary" />
              Settings
            </a>
          </div>
        </nav>
        
        <div className="mt-auto pt-4 border-t border-gray-700">
          <div className="flex items-center text-sm text-gray-300">
            <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
            APIs Connected
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 overflow-auto p-4 bg-gray-900">
        <div className="max-w-5xl mx-auto">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-white">Saved Transcripts</h2>
            <p className="text-gray-400">Browse and manage your saved transcriptions</p>
          </div>

          {/* Error state */}
          {error && (
            <div className="bg-red-900/20 border border-red-700 rounded-md p-4 mb-6">
              <p className="text-red-400">Failed to load transcripts: {error instanceof Error ? error.message : 'Unknown error'}</p>
            </div>
          )}

          {/* Loading state */}
          {isLoading && (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-gray-800 rounded-lg p-5 shadow-lg">
                  <div className="flex justify-between items-center mb-4">
                    <Skeleton className="h-6 w-1/3" />
                    <Skeleton className="h-6 w-24" />
                  </div>
                  <Skeleton className="h-24 w-full mb-4" />
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-32" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!isLoading && transcripts && transcripts.length === 0 && (
            <div className="bg-gray-800 rounded-lg p-8 text-center">
              <Layers className="h-12 w-12 mx-auto mb-4 text-gray-500" />
              <h3 className="text-lg font-medium text-white mb-2">No saved transcripts</h3>
              <p className="text-gray-400 mb-6">You haven't saved any transcriptions yet.</p>
              <Button asChild>
                <Link href="/">
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Transcription
                </Link>
              </Button>
            </div>
          )}

          {/* List of transcripts */}
          {!isLoading && transcripts && transcripts.length > 0 && (
            <div className="space-y-4">
              {transcripts.map((transcript: Transcript) => (
                <div key={transcript.id} className="group">
                  <SavedTranscriptItem 
                    transcript={transcript}
                    onDelete={() => setSelectedTranscript(transcript)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!selectedTranscript} onOpenChange={(open) => !open && setSelectedTranscript(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Transcript</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this transcript? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                if (selectedTranscript) {
                  handleDeleteTranscript(selectedTranscript.id);
                  setSelectedTranscript(null);
                }
              }}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
