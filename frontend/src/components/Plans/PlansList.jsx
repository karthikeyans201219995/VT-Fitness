import React, { useState, useEffect } from 'react';
import { plansAPI, membersAPI, paymentsAPI } from '../../services/api';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Check, Star, Loader2, Plus, Edit, Trash2, Crown, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../hooks/use-toast';

const PlanCard = ({ plan, isPopular, userRole, onDelete, currentPlan, onUpgrade, isCurrentPlan }) => {
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
      {isCurrentPlan && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <Badge className="bg-green-600 text-white px-4 py-1">
            <Crown className="h-3 w-3 mr-1 inline" />
            Current Plan
          </Badge>
        </div>
      )}
      {!isCurrentPlan && isPopular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <Badge className="bg-blue-600 text-white px-4 py-1">
            <Star className="h-3 w-3 mr-1 inline" />
            Most Popular
          </Badge>
        </div>
      )}
      {userRole === 'admin' && (
        <div className="absolute top-2 right-2">
          <Button
            variant="outline"
            size="sm"
            className="border-red-700 text-red-400 hover:bg-red-900"
            onClick={() => onDelete(plan.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
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
        {isCurrentPlan ? (
          <Button
            className="w-full bg-green-600 hover:bg-green-700 text-white"
            disabled
          >
            <Crown className="h-4 w-4 mr-2" />
            Active Plan
          </Button>
        ) : (
          <Button
            className={`w-full ${
              isPopular
                ? 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/50'
                : 'bg-gray-800 hover:bg-gray-700 text-white'
            }`}
            disabled={!plan.is_active}
            onClick={() => userRole === 'member' && onUpgrade(plan)}
          >
            {userRole === 'member' ? 'Upgrade to This Plan' : 'Select Plan'}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

const PlansList = () => {
  const { user, isMember } = useAuth();
  const { toast } = useToast();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [memberData, setMemberData] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const [newPlan, setNewPlan] = useState({
    name: '',
    description: '',
    duration_months: 1,
    price: '',
    features: '',
    is_active: true
  });

  useEffect(() => {
    fetchPlans();
    if (isMember) {
      fetchMemberData();
    }
  }, [isMember]);

  const fetchPlans = async () => {
    try {
      const data = await plansAPI.getAll();
      setPlans(data || []);
    } catch (error) {
      console.error('Error fetching plans:', error);
      toast({
        title: "Error",
        description: "Failed to load plans",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMemberData = async () => {
    try {
      const members = await membersAPI.getAll();
      const currentMember = members.find(m => m.email === user?.email);
      setMemberData(currentMember);
    } catch (error) {
      console.error('Error fetching member data:', error);
    }
  };

  const handleUpgradeClick = (plan) => {
    setSelectedPlan(plan);
    setShowUpgradeDialog(true);
  };

  const handleConfirmUpgrade = async () => {
    if (!selectedPlan || !memberData) return;

    try {
      setUpgrading(true);
      
      // Calculate new end date based on plan duration
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + selectedPlan.duration_months);

      // Update member with new plan and track old plan
      try {
        const updateData = {
          previous_plan_id: memberData.plan_id, // Store old plan
          plan_id: selectedPlan.id,
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
          plan_changed_at: startDate.toISOString(),
          status: 'active',
          // Update balance tracking
          total_amount_due: (memberData.total_amount_due || 0) + parseFloat(selectedPlan.price),
          balance_due: (memberData.balance_due || 0) + parseFloat(selectedPlan.price)
        };
        
        await membersAPI.update(memberData.id, updateData);
      } catch (updateError) {
        console.error('Member update error:', updateError);
        throw new Error('Failed to update membership plan');
      }

      // Create payment record for the upgrade
      try {
        await paymentsAPI.create({
          member_id: memberData.id,
          amount: parseFloat(selectedPlan.price),
          payment_method: 'cash',
          payment_date: startDate.toISOString().split('T')[0],
          plan_id: selectedPlan.id,
          description: `Plan upgrade from ${memberData.plan_name || 'previous plan'} to ${selectedPlan.name}`,
          status: 'completed',
          payment_type: 'upgrade'
        });
      } catch (paymentError) {
        console.error('Payment creation error:', paymentError);
        // Payment failed but member was updated - log this
        toast({
          title: "Warning",
          description: "Plan updated but payment record failed. Please contact support.",
          variant: "destructive",
        });
        setShowUpgradeDialog(false);
        setSelectedPlan(null);
        fetchMemberData();
        return;
      }

      toast({
        title: "Success!",
        description: `You've successfully upgraded to ${selectedPlan.name}`,
      });

      setShowUpgradeDialog(false);
      setSelectedPlan(null);
      fetchMemberData(); // Refresh member data
    } catch (error) {
      console.error('Upgrade error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to upgrade plan. Please contact support.",
        variant: "destructive",
      });
    } finally {
      setUpgrading(false);
    }
  };

  const handleAddPlan = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const planData = {
        ...newPlan,
        price: parseFloat(newPlan.price),
        duration_months: parseInt(newPlan.duration_months),
        features: newPlan.features.split('\n').filter(f => f.trim())
      };
      await plansAPI.create(planData);
      toast({
        title: "Success",
        description: "Plan added successfully",
      });
      setIsAddDialogOpen(false);
      setNewPlan({
        name: '',
        description: '',
        duration_months: 1,
        price: '',
        features: '',
        is_active: true
      });
      fetchPlans();
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to add plan",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePlan = async (planId) => {
    if (!window.confirm('Are you sure you want to delete this plan?')) return;
    
    try {
      setLoading(true);
      await plansAPI.delete(planId);
      toast({
        title: "Success",
        description: "Plan deleted successfully",
      });
      fetchPlans();
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete plan",
        variant: "destructive",
      });
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
      {/* Current Plan Section for Members */}
      {isMember && memberData && memberData.plan_id && (
        <>
          <Card className="bg-gradient-to-r from-green-900/30 to-blue-900/30 border-green-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Crown className="h-5 w-5 text-green-400" />
                    Your Current Plan
                  </CardTitle>
                  <p className="text-gray-400 mt-1">Active membership details</p>
                </div>
                <Badge className="bg-green-600 text-white">Active</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <p className="text-gray-400 text-sm">Plan Name</p>
                  <p className="text-white font-semibold text-lg">{memberData.plan_name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Valid Until</p>
                  <p className="text-white font-semibold text-lg">
                    {memberData.end_date ? new Date(memberData.end_date).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Status</p>
                  <p className="text-green-400 font-semibold text-lg">
                    {new Date(memberData.end_date) > new Date() ? 'Active' : 'Expired'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Balance Card for Members */}
          {(memberData.balance_due > 0 || memberData.total_amount_due > 0) && (
            <Card className="bg-gradient-to-r from-orange-900/30 to-red-900/30 border-orange-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-orange-400" />
                  Payment Balance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-gray-400 text-sm">Total Amount Due</p>
                    <p className="text-white font-semibold text-lg">${(memberData.total_amount_due || 0).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Amount Paid</p>
                    <p className="text-green-400 font-semibold text-lg">${(memberData.amount_paid || 0).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Balance Due</p>
                    <p className="text-orange-400 font-semibold text-lg">${(memberData.balance_due || 0).toFixed(2)}</p>
                  </div>
                </div>
                {memberData.balance_due > 0 && (
                  <div className="mt-4 p-3 bg-orange-900/20 border border-orange-800 rounded-lg">
                    <p className="text-orange-400 text-sm">
                      <AlertCircle className="h-4 w-4 inline mr-1" />
                      You have an outstanding balance. Please contact the gym to make a payment.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}

      <div className="flex justify-between items-center">
        <div className="text-center flex-1">
          <h1 className="text-4xl font-bold text-white mb-2">
            {isMember ? 'Upgrade Your Plan' : 'Membership Plans'}
          </h1>
          <p className="text-gray-400 text-lg">
            {isMember ? 'Choose a better plan for your fitness journey' : 'Choose the perfect plan for your fitness journey'}
          </p>
        </div>
        {user?.role === 'admin' && (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="mr-2 h-4 w-4" />
                Add Plan
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Plan</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddPlan} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Plan Name</Label>
                    <Input
                      id="name"
                      value={newPlan.name}
                      onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
                      className="bg-gray-800 border-gray-700 text-white"
                      placeholder="e.g., Basic Plan"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="price">Price ($)</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={newPlan.price}
                      onChange={(e) => setNewPlan({ ...newPlan, price: e.target.value })}
                      className="bg-gray-800 border-gray-700 text-white"
                      placeholder="29.99"
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="duration">Duration (months)</Label>
                  <select
                    id="duration"
                    value={newPlan.duration_months}
                    onChange={(e) => setNewPlan({ ...newPlan, duration_months: e.target.value })}
                    className="w-full bg-gray-800 border-gray-700 text-white rounded-md px-3 py-2"
                    required
                  >
                    <option value="1">1 Month</option>
                    <option value="3">3 Months</option>
                    <option value="6">6 Months</option>
                    <option value="12">12 Months</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newPlan.description}
                    onChange={(e) => setNewPlan({ ...newPlan, description: e.target.value })}
                    className="bg-gray-800 border-gray-700 text-white"
                    placeholder="Brief description of the plan"
                    rows={2}
                  />
                </div>
                <div>
                  <Label htmlFor="features">Features (one per line)</Label>
                  <Textarea
                    id="features"
                    value={newPlan.features}
                    onChange={(e) => setNewPlan({ ...newPlan, features: e.target.value })}
                    className="bg-gray-800 border-gray-700 text-white"
                    placeholder="Access to gym equipment&#10;Free fitness assessment&#10;Personal trainer sessions"
                    rows={5}
                    required
                  />
                </div>
                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>
                  {loading ? 'Adding...' : 'Add Plan'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Monthly Plans */}
      {monthlyPlans.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-white mb-4">Monthly Plans</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {monthlyPlans.map((plan) => (
              <PlanCard 
                key={plan.id} 
                plan={plan} 
                isPopular={false} 
                userRole={user?.role} 
                onDelete={handleDeletePlan}
                currentPlan={memberData?.plan_id}
                onUpgrade={handleUpgradeClick}
                isCurrentPlan={memberData?.plan_id === plan.id}
              />
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
              <PlanCard 
                key={plan.id} 
                plan={plan} 
                isPopular={true} 
                userRole={user?.role} 
                onDelete={handleDeletePlan}
                currentPlan={memberData?.plan_id}
                onUpgrade={handleUpgradeClick}
                isCurrentPlan={memberData?.plan_id === plan.id}
              />
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
              <PlanCard 
                key={plan.id} 
                plan={plan} 
                isPopular={false} 
                userRole={user?.role} 
                onDelete={handleDeletePlan}
                currentPlan={memberData?.plan_id}
                onUpgrade={handleUpgradeClick}
                isCurrentPlan={memberData?.plan_id === plan.id}
              />
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

      {/* Upgrade Confirmation Dialog */}
      <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-blue-400" />
              Confirm Plan Upgrade
            </DialogTitle>
          </DialogHeader>
          {selectedPlan && (
            <div className="space-y-4">
              <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-2">New Plan Details</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Plan Name:</span>
                    <span className="text-white font-semibold">{selectedPlan.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Duration:</span>
                    <span className="text-white font-semibold">
                      {selectedPlan.duration_months} {selectedPlan.duration_months === 1 ? 'Month' : 'Months'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Price:</span>
                    <span className="text-white font-semibold text-lg">${selectedPlan.price}</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-900/20 border border-blue-800 p-3 rounded-lg">
                <p className="text-blue-400 text-sm">
                  <AlertCircle className="h-4 w-4 inline mr-1" />
                  Your membership will be updated immediately and a payment record will be created.
                </p>
              </div>
            </div>
          )}
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowUpgradeDialog(false)}
              className="border-gray-700 text-white hover:bg-gray-800"
              disabled={upgrading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmUpgrade}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={upgrading}
            >
              {upgrading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Upgrading...
                </>
              ) : (
                'Confirm Upgrade'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PlansList;
