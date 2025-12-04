import React, { useState, useEffect } from 'react';
import { plansAPI } from '../../services/api';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Check, Star, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const PlanCard = ({ plan, isPopular, userRole }) => {
  const durationLabel = plan.duration_months === 1 ? '1 Month' : 
                       plan.duration_months === 3 ? '3 Months' : 
                       plan.duration_months === 12 ? '12 Months' : 
                       `${plan.duration_months} Months`;
  
  return (
    <Card
      className={`bg-gray-900 border-gray-800 hover:border-blue-600 transition-all duration-300 relative ${
        isPopular ? 'shadow-lg shadow-blue-600/30' : ''
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
          disabled={!plan.is_active}
        >
          {userRole === 'member' ? 'Upgrade Plan' : 'Select Plan'}
        </Button>
      </CardFooter>
    </Card>
  );
};

const PlansList = () => {
  const { user } = useAuth();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const data = await plansAPI.getAll();
      setPlans(data || []);
    } catch (error) {
      console.error('Error fetching plans:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const monthlyPlans = plans.filter(p => p.duration_months === 1 && p.is_active);
  const quarterlyPlans = plans.filter(p => p.duration_months === 3 && p.is_active);
  const annualPlans = plans.filter(p => p.duration_months === 12 && p.is_active);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-2">Membership Plans</h1>
        <p className="text-gray-400 text-lg">Choose the perfect plan for your fitness journey</p>
      </div>

      {/* Monthly Plans */}
      {monthlyPlans.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-white mb-4">Monthly Plans</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {monthlyPlans.map((plan) => (
              <PlanCard key={plan.id} plan={plan} isPopular={false} userRole={user?.role} />
            ))}
          </div>
        </div>
      )}

      {/* Quarterly Plans */}
      {quarterlyPlans.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-white mb-4">Quarterly Plans</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {quarterlyPlans.map((plan) => (
              <PlanCard key={plan.id} plan={plan} isPopular={true} userRole={user?.role} />
            ))}
          </div>
        </div>
      )}

      {/* Annual Plans */}
      {annualPlans.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-white mb-4">Annual Plans</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {annualPlans.map((plan) => (
              <PlanCard key={plan.id} plan={plan} isPopular={false} userRole={user?.role} />
            ))}
          </div>
        </div>
      )}

      {plans.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          No plans available at the moment.
        </div>
      )}

      {/* Benefits Section */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white text-center">Why Choose FitLife Gym?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center p-3 bg-blue-600 rounded-full mb-3">
                <Check className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">State-of-the-Art Equipment</h3>
              <p className="text-gray-400 text-sm">Latest fitness equipment and technology</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center p-3 bg-blue-600 rounded-full mb-3">
                <Check className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Expert Trainers</h3>
              <p className="text-gray-400 text-sm">Certified professionals to guide you</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center p-3 bg-blue-600 rounded-full mb-3">
                <Check className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Flexible Hours</h3>
              <p className="text-gray-400 text-sm">Open from 5 AM to 11 PM daily</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PlansList;
