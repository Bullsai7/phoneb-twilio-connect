import React, { useState } from 'react';
import { Plus, Edit, Trash2, Check, Star, StarOff, Copy, Eye, EyeOff } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useTwilioAccounts } from '@/hooks/useTwilioAccounts';
import { TwilioAccount } from '@/components/Calls/hooks/useCallSetup';
import { toast } from "sonner";

const AccountForm = ({ 
  onSubmit, 
  initialData = null, 
  title = "Add Twilio Account",
  submitLabel = "Add Account"
}: { 
  onSubmit: (data: any) => void, 
  initialData?: Partial<TwilioAccount> | null,
  title?: string,
  submitLabel?: string
}) => {
  const [formData, setFormData] = useState({
    account_name: initialData?.account_name || '',
    account_sid: initialData?.account_sid || '',
    auth_token: initialData?.auth_token || '',
    app_sid: initialData?.app_sid || '',
    phone_number: initialData?.phone_number || '',
    is_default: initialData?.is_default || false
  });
  const [showAuthToken, setShowAuthToken] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.account_name || !formData.account_sid || !formData.auth_token) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>
          Enter your Twilio account details to add it to your PhoneB app.
        </DialogDescription>
      </DialogHeader>
      
      <div className="space-y-4">
        <div className="grid w-full gap-1.5">
          <Label htmlFor="account_name">Account Name*</Label>
          <Input
            id="account_name"
            name="account_name"
            value={formData.account_name}
            onChange={handleChange}
            placeholder="My Twilio Account"
            required
          />
        </div>
        
        <div className="grid w-full gap-1.5">
          <Label htmlFor="account_sid">Account SID*</Label>
          <Input
            id="account_sid"
            name="account_sid"
            value={formData.account_sid}
            onChange={handleChange}
            placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
            required
          />
        </div>
        
        <div className="grid w-full gap-1.5">
          <Label htmlFor="auth_token">Auth Token*</Label>
          <div className="flex">
            <Input
              id="auth_token"
              name="auth_token"
              value={formData.auth_token}
              onChange={handleChange}
              type={showAuthToken ? "text" : "password"}
              placeholder="your_auth_token"
              required
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="ml-2"
              onClick={() => setShowAuthToken(!showAuthToken)}
            >
              {showAuthToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        
        <div className="grid w-full gap-1.5">
          <Label htmlFor="app_sid">TwiML App SID</Label>
          <Input
            id="app_sid"
            name="app_sid"
            value={formData.app_sid}
            onChange={handleChange}
            placeholder="APxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
          />
        </div>
        
        <div className="grid w-full gap-1.5">
          <Label htmlFor="phone_number">Phone Number</Label>
          <Input
            id="phone_number"
            name="phone_number"
            value={formData.phone_number}
            onChange={handleChange}
            placeholder="+1234567890"
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="is_default"
            name="is_default"
            checked={formData.is_default}
            onChange={handleChange}
            className="h-4 w-4 rounded border-gray-300"
          />
          <Label htmlFor="is_default">Set as default account</Label>
        </div>
      </div>
      
      <DialogFooter>
        <Button type="submit">{submitLabel}</Button>
      </DialogFooter>
    </form>
  );
};

const AccountsManagement = () => {
  const { 
    accounts, 
    defaultAccount,
    loading, 
    error, 
    refreshAccounts,
    addAccount,
    updateAccount,
    deleteAccount,
    setAsDefault
  } = useTwilioAccounts();
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<TwilioAccount | null>(null);
  
  const handleAddAccount = async (accountData: any) => {
    const success = await addAccount(accountData);
    if (success) {
      setIsAddDialogOpen(false);
    }
  };
  
  const handleUpdateAccount = async (accountData: any) => {
    if (!editingAccount) return;
    
    const success = await updateAccount(editingAccount.id, accountData);
    if (success) {
      setEditingAccount(null);
    }
  };
  
  const handleDeleteAccount = async (account: TwilioAccount) => {
    if (window.confirm(`Are you sure you want to delete the account "${account.account_name}"?`)) {
      await deleteAccount(account.id, accounts);  // Added 'accounts' as the second argument
    }
  };
  
  const handleSetAsDefault = async (account: TwilioAccount) => {
    await setAsDefault(account.id);
  };

  const copyToClipboard = (text: string, description: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${description} copied to clipboard`);
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Twilio Accounts</CardTitle>
          <CardDescription>Loading accounts...</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center p-6">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Twilio Accounts</CardTitle>
          <CardDescription>Error loading accounts</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
          <Button onClick={refreshAccounts} className="mt-4">Retry</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Twilio Accounts</CardTitle>
        <CardDescription>
          Manage your Twilio accounts for making calls and sending messages
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {accounts.length === 0 ? (
          <div className="text-center p-4">
            <p className="text-muted-foreground mb-4">You haven't added any Twilio accounts yet.</p>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" /> Add Twilio Account
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <AccountForm onSubmit={handleAddAccount} />
              </DialogContent>
            </Dialog>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Your Accounts</h3>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" /> Add Account
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <AccountForm onSubmit={handleAddAccount} />
                </DialogContent>
              </Dialog>
            </div>
            
            <div className="space-y-3">
              {accounts.map((account) => (
                <Card key={account.id} className={`${account.is_default ? 'border-primary' : 'border-border'}`}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        {account.is_default && <Star className="h-4 w-4 text-yellow-500 mr-2" />}
                        <CardTitle className="text-base">{account.account_name}</CardTitle>
                      </div>
                      <div className="flex space-x-1">
                        {!account.is_default && (
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-8 w-8" 
                            onClick={() => handleSetAsDefault(account)}
                            title="Set as default"
                          >
                            <StarOff className="h-4 w-4" />
                          </Button>
                        )}
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="icon" 
                              className="h-8 w-8"
                              onClick={() => setEditingAccount(account)}
                              title="Edit account"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          {editingAccount && (
                            <DialogContent className="sm:max-w-[425px]">
                              <AccountForm 
                                onSubmit={handleUpdateAccount} 
                                initialData={editingAccount}
                                title="Edit Twilio Account"
                                submitLabel="Save Changes"
                              />
                            </DialogContent>
                          )}
                        </Dialog>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-8 w-8" 
                          onClick={() => handleDeleteAccount(account)}
                          title="Delete account"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <CardDescription className="text-xs">
                      Account SID: {account.account_sid.substring(0, 8)}...
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 ml-1" 
                        onClick={() => copyToClipboard(account.account_sid, "Account SID")}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-4 pt-0">
                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="details">
                        <AccordionTrigger className="text-sm py-2">Account Details</AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-2 text-sm">
                            <div className="grid grid-cols-3 gap-1">
                              <span className="font-medium text-muted-foreground">Phone Number:</span>
                              <span className="col-span-2">{account.phone_number || "Not set"}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-1">
                              <span className="font-medium text-muted-foreground">TwiML App SID:</span>
                              <span className="col-span-2">
                                {account.app_sid ? (
                                  <>
                                    {account.app_sid.substring(0, 8)}...
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="h-6 w-6 ml-1" 
                                      onClick={() => copyToClipboard(account.app_sid || "", "App SID")}
                                    >
                                      <Copy className="h-3 w-3" />
                                    </Button>
                                  </>
                                ) : (
                                  "Not set"
                                )}
                              </span>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter>
        <div className="text-xs text-muted-foreground">
          {defaultAccount ? `Using "${defaultAccount.account_name}" as your default account` : "No default account set"}
        </div>
      </CardFooter>
    </Card>
  );
};

export default AccountsManagement;
