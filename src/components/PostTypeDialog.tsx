import React from 'react';
import { Building2, Search } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface PostTypeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (type: 'property' | 'client-request') => void;
}

const PostTypeDialog: React.FC<PostTypeDialogProps> = ({ open, onOpenChange, onSelect }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>What would you like to post?</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 pt-4">
          <Button
            variant="outline"
            className="flex flex-col items-center gap-4 h-auto py-6"
            onClick={() => onSelect('property')}
          >
            <Building2 className="h-8 w-8" />
            <div className="space-y-1 text-center">
              <h3 className="font-medium">Property</h3>
              <p className="text-sm text-muted-foreground">List a property for rent</p>
            </div>
          </Button>
          <Button
            variant="outline"
            className="flex flex-col items-center gap-4 h-auto py-6"
            onClick={() => onSelect('client-request')}
          >
            <Search className="h-8 w-8" />
            <div className="space-y-1 text-center">
              <h3 className="font-medium">Client Request</h3>
              <p className="text-sm text-muted-foreground">Post a search request</p>
            </div>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PostTypeDialog;