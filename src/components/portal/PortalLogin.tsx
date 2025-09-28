import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, Lock, User, Key } from 'lucide-react';
import { usePortalAuth } from '@/hooks/usePortalAuth';

export const PortalLogin = () => {
  const [username, setUsername] = useState('');
  const [credentialCode, setCredentialCode] = useState('');
  const { authenticate, authenticating } = usePortalAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !credentialCode.trim()) return;
    
    await authenticate(username.trim(), credentialCode.trim());
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="bg-background/95 backdrop-blur-sm border-border/50 shadow-2xl">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                ChamaWallet Portal
              </CardTitle>
              <CardDescription className="text-muted-foreground mt-2">
                Secure access for administrators and authorized personnel
              </CardDescription>
            </div>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="username" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Username
                </Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  className="bg-background/50"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="credential" className="flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  Access Code
                </Label>
                <Input
                  id="credential"
                  type="password"
                  value={credentialCode}
                  onChange={(e) => setCredentialCode(e.target.value)}
                  placeholder="Enter your access code"
                  className="bg-background/50"
                  required
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                disabled={authenticating || !username.trim() || !credentialCode.trim()}
              >
                {authenticating ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Authenticating...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Secure Login
                  </div>
                )}
              </Button>
            </form>
            
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                Demo Access Credentials:
              </h4>
              <div className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <p><strong>Super Admin Code:</strong> PTC-ADMIN2024</p>
                <p className="text-xs text-blue-600 dark:text-blue-300">
                  Valid for 7 days from system deployment
                </p>
              </div>
            </div>
            
            <div className="mt-4 text-center">
              <p className="text-xs text-muted-foreground">
                Powered by Daraja-style secure authentication
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};