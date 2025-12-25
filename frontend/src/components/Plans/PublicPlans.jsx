import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { plansAPI } from '../../services/api';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Check, Star, Loader2, ArrowRight, Dumbbell } from 'lucide-react';

const PublicPlanCard = ({ plan, isPopular }) => {
  const navigate = useNavigate();
  const durationLabel = plan.duration_months === 1 ? '1 Month' : 
                       plan.duration_months === 3 ? '3 Months' : 
                       plan.duration_months === 12 ? '12 Months' : 
                       `${plan.duration_months} Months`;
  
  return (
    <Card
      className={`bg-gray-900 border-gray-800 hover:border-blue-600 transition-all duration-300 relative ${
        isPopular ? 'shadow-lg shadow-blue-600/30 scale-105' : ''
      }`}
    >
      {isPopular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <Badge className="bg-blue-600 text-white px-4 py-1">
            <Star className="h-3 w-3 mr-1 inline" />
            Most Popular
          </Badge>
        </div>
      )}
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-2xl text-white mb-2">{plan.name}</CardTitle>
        <div className="flex items-baseline justify-center">
          <span className="text-5xl font-bold text-white">${plan.price}</span>
          <span className="text-gray-400 ml-2">/ {durationLabel}</span>
        </div>
        {plan.description && (
          <p className="text-gray-400 text-sm mt-2">{plan.description}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {plan.features && plan.features.map((feature, index) => (
            <div key={index} className="flex items-start">
              <Check className="h-5 w-5 text-blue-400 mr-3 flex-shrink-0 mt-0.5" />
              <span className="text-gray-300 text-sm">{feature}</span>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter>
        <Button
          className={`w-full ${
            isPopular
              ? 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/50'
              : 'bg-gray-800 hover:bg-gray-700 text-white'
          }`}
          disabled
        >
          Contact Gym to Join
        </Button>
      </CardFooter>
    </Card>
  );
};

const PublicPlans = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlans();
    
    // Failsafe: stop loading after 5 seconds no matter what
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 5000);
    
    return () => clearTimeout(timeout);
  }, []);

  const fetchPlans = async () => {
    try {
      const data = await plansAPI.getAll();
      setPlans((data || []).filter(p => p.is_active));
    } catch (error) {
      console.error('Error fetching plans:', error);
      setPlans([]);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const monthlyPlans = plans.filter(p => p.duration_months === 1);
  const quarterlyPlans = plans.filter(p => p.duration_months === 3);
  const annualPlans = plans.filter(p => p.duration_months === 12);

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-2 flex justify-between items-center">
          <div className="flex items-center">
            <img 
              src="/logo/37006_Vi fitness_LOGO_PG-01.png" 
              alt="VI FITNESS" 
              className="h-28 my-0 py-0"
            />
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => navigate('/login')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Member Login
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            Choose Your Perfect Plan
          </h1>
          <p className="text-gray-400 text-xl max-w-2xl mx-auto">
            Start your fitness journey today with our flexible membership plans. 
            No hidden fees, cancel anytime.
          </p>
        </div>

        {/* Monthly Plans */}
        {monthlyPlans.length > 0 && (
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-white mb-8 text-center">Monthly Plans</h2>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
              {monthlyPlans.map((plan) => (
                <PublicPlanCard 
                  key={plan.id} 
                  plan={plan} 
                  isPopular={false}
                />
              ))}
            </div>
          </div>
        )}

        {/* Quarterly Plans */}
        {quarterlyPlans.length > 0 && (
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-white mb-8 text-center">Quarterly Plans</h2>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
              {quarterlyPlans.map((plan) => (
                <PublicPlanCard 
                  key={plan.id} 
                  plan={plan} 
                  isPopular={true}
                />
              ))}
            </div>
          </div>
        )}

        {/* Annual Plans */}
        {annualPlans.length > 0 && (
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-white mb-8 text-center">Annual Plans</h2>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
              {annualPlans.map((plan) => (
                <PublicPlanCard 
                  key={plan.id} 
                  plan={plan} 
                  isPopular={false}
                />
              ))}
            </div>
          </div>
        )}

        {/* Benefits Section */}
        <Card className="bg-gray-900 border-gray-800 max-w-6xl mx-auto mt-16">
          <CardHeader>
            <CardTitle className="text-white text-center text-3xl">Why Choose VI FITNESS?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="inline-flex items-center justify-center p-4 bg-blue-600 rounded-full mb-4">
                  <Check className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">State-of-the-Art Equipment</h3>
                <p className="text-gray-400">Latest fitness equipment and technology for optimal results</p>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center justify-center p-4 bg-blue-600 rounded-full mb-4">
                  <Check className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">Expert Trainers</h3>
                <p className="text-gray-400">Certified professionals to guide your fitness journey</p>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center justify-center p-4 bg-blue-600 rounded-full mb-4">
                  <Check className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">Flexible Hours</h3>
                <p className="text-gray-400">Open from 5 AM to 11 PM daily for your convenience</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA Section */}
        <div className="text-center mt-16">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Start?</h2>
          <p className="text-gray-400 mb-8 text-lg">Visit our gym to register and start your fitness journey</p>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 max-w-2xl mx-auto">
            <p className="text-white text-lg mb-2">Contact us to join:</p>
            <p className="text-gray-400">Visit FitLife Gym in person or call us to register</p>
            <p className="text-blue-400 mt-4 text-xl font-semibold">+91 98765 43210</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-800 bg-gray-900/50 mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-gray-400">
            <p>&copy; 2025 FitLife Gym. All rights reserved.</p>
            <p className="mt-2">
              Members can{' '}
              <button
                onClick={() => navigate('/login')}
                className="text-blue-400 hover:text-blue-300 underline"
              >
                login here
              </button>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicPlans;
