import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Dumbbell, Mail, Lock } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import SynapseBackground from '../ui/synapse-background';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('Attempting login with:', email);
      const result = await login(email, password);
      console.log('Login result:', result);
      
      if (result.success) {
        toast({
          title: "Login Successful",
          description: `Welcome back!`,
        });
        navigate('/dashboard');
      } else {
        toast({
          title: "Login Failed",
          description: result.message || "Invalid credentials",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to connect to server",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SynapseBackground
      particleCount={4000}
      connectionDistance={60}
      className="flex items-center justify-center p-4"
    >
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <img 
              src="/logo/37006_Vi fitness_LOGO_PG-01.png" 
              alt="VI FITNESS" 
              className="h-32"
            />
          </div>
          <p className="text-gray-400">Transform Your Body, Transform Your Life</p>
        </div>

        <Card className="bg-gray-900/30 backdrop-blur-xl border-gray-700/50 shadow-2xl shadow-blue-500/10">
          <CardHeader>
            <CardTitle className="text-2xl text-white">Welcome Back</CardTitle>
            <CardDescription className="text-gray-400">
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-300">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-gray-800/50 backdrop-blur-sm border-gray-600/50 text-white placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-300">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 bg-gray-800/50 backdrop-blur-sm border-gray-600/50 text-white placeholder:text-gray-400 focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
              <div className="bg-gray-800/40 backdrop-blur-sm rounded-lg p-3 text-sm text-gray-400 border border-gray-700/30">
                <p className="font-semibold text-white mb-2">Demo Credentials:</p>
                <p>Admin: admin@gymfit.com / admin123</p>
                <p>Trainer: trainer@gymfit.com / trainer123</p>
                <p>Member: member@gymfit.com / member123</p>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/50 transition-all duration-200"
                disabled={loading}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
              <p className="text-center text-gray-400 text-sm">
                New member? Visit the gym to register
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </SynapseBackground>
  );
};

export default Login;
