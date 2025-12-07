import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { plansAPI } from '../../services/api';
import { Loader2 } from 'lucide-react';

const AddMemberForm = ({ onSubmit, onCancel }) => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    phone: '',
    date_of_birth: '',
    gender: '',
    address: '',
    blood_group: '',
    emergency_contact: '',
    emergency_phone: '',
    medical_conditions: '',
    plan_id: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    status: 'active'
  });

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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
    
    // Auto-calculate end date based on plan
    if (name === 'plan_id') {
      const selectedPlan = plans.find(p => p.id === value);
      if (selectedPlan && formData.start_date) {
        const startDate = new Date(formData.start_date);
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + selectedPlan.duration_months);
        setFormData(prev => ({ 
          ...prev, 
          end_date: endDate.toISOString().split('T')[0]
        }));
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Clean up form data - convert empty strings to null for optional fields
    const cleanedData = { ...formData };
    Object.keys(cleanedData).forEach(key => {
      if (cleanedData[key] === '') {
        // Keep required fields as empty strings, convert optional fields to null
        const optionalFields = ['password', 'date_of_birth', 'gender', 'address', 'blood_group', 
                                'emergency_contact', 'emergency_phone', 'medical_conditions', 'plan_id'];
        if (optionalFields.includes(key)) {
          cleanedData[key] = null;
        }
      }
    });
    
    onSubmit(cleanedData);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-gray-300">Full Name</Label>
          <Input
            name="full_name"
            value={formData.full_name}
            onChange={handleChange}
            className="bg-gray-800 border-gray-700 text-white"
            required
          />
        </div>
        <div className="space-y-2">
          <Label className="text-gray-300">Email</Label>
          <Input
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            className="bg-gray-800 border-gray-700 text-white"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-gray-300">Password (for member login)</Label>
          <Input
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            className="bg-gray-800 border-gray-700 text-white"
            placeholder="Leave empty for auto-generated password"
          />
          <p className="text-xs text-gray-500">If left empty, a random password will be generated</p>
        </div>
        <div className="space-y-2">
          <Label className="text-gray-300">Phone</Label>
          <Input
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={handleChange}
            className="bg-gray-800 border-gray-700 text-white"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-gray-300">Date of Birth</Label>
        <Input
          name="date_of_birth"
          type="date"
          value={formData.date_of_birth}
          onChange={handleChange}
          className="bg-gray-800 border-gray-700 text-white"
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label className="text-gray-300">Gender</Label>
          <Select onValueChange={(value) => handleSelectChange('gender', value)}>
            <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              <SelectItem value="Male">Male</SelectItem>
              <SelectItem value="Female">Female</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-gray-300">Blood Group</Label>
          <Select onValueChange={(value) => handleSelectChange('blood_group', value)}>
            <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              <SelectItem value="A+">A+</SelectItem>
              <SelectItem value="A-">A-</SelectItem>
              <SelectItem value="B+">B+</SelectItem>
              <SelectItem value="B-">B-</SelectItem>
              <SelectItem value="O+">O+</SelectItem>
              <SelectItem value="O-">O-</SelectItem>
              <SelectItem value="AB+">AB+</SelectItem>
              <SelectItem value="AB-">AB-</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-gray-300">Status</Label>
          <Select value={formData.status} onValueChange={(value) => handleSelectChange('status', value)}>
            <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-gray-300">Address</Label>
        <Input
          name="address"
          value={formData.address}
          onChange={handleChange}
          className="bg-gray-800 border-gray-700 text-white"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-gray-300">Emergency Contact Name</Label>
          <Input
            name="emergency_contact"
            value={formData.emergency_contact}
            onChange={handleChange}
            className="bg-gray-800 border-gray-700 text-white"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-gray-300">Emergency Contact Phone</Label>
          <Input
            name="emergency_phone"
            type="tel"
            value={formData.emergency_phone}
            onChange={handleChange}
            className="bg-gray-800 border-gray-700 text-white"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-gray-300">Medical Conditions (if any)</Label>
        <Input
          name="medical_conditions"
          value={formData.medical_conditions}
          onChange={handleChange}
          className="bg-gray-800 border-gray-700 text-white"
          placeholder="Optional"
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label className="text-gray-300">Select Plan *</Label>
          <Select onValueChange={(value) => handleSelectChange('plan_id', value)} required>
            <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
              <SelectValue placeholder="Choose plan" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              {plans.map(plan => (
                <SelectItem key={plan.id} value={plan.id}>{plan.name} - ${plan.price}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-gray-300">Start Date</Label>
          <Input
            name="start_date"
            type="date"
            value={formData.start_date}
            onChange={handleChange}
            className="bg-gray-800 border-gray-700 text-white"
            required
          />
        </div>
        <div className="space-y-2">
          <Label className="text-gray-300">End Date</Label>
          <Input
            name="end_date"
            type="date"
            value={formData.end_date}
            onChange={handleChange}
            className="bg-gray-800 border-gray-700 text-white"
            required
          />
        </div>
      </div>

      <div className="border-t border-gray-700 pt-4 mt-4">
        <h3 className="text-lg font-semibold text-white mb-4">Payment Information (Required)</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label className="text-gray-300">Payment Amount</Label>
            <Input
              name="payment_amount"
              type="number"
              step="0.01"
              value={formData.payment_amount}
              onChange={handleChange}
              className="bg-gray-800 border-gray-700 text-white"
              required
              placeholder="0.00"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-gray-300">Payment Method</Label>
            <Select value={formData.payment_method} onValueChange={(value) => handleSelectChange('payment_method', value)}>
              <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="upi">UPI</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-gray-300">Payment Date</Label>
            <Input
              name="payment_date"
              type="date"
              value={formData.payment_date}
              onChange={handleChange}
              className="bg-gray-800 border-gray-700 text-white"
              required
            />
          </div>
        </div>
        <p className="text-sm text-yellow-500 mt-2">⚠️ Payment must be completed before member can be added</p>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} className="border-gray-700 text-white hover:bg-gray-700">
          Cancel
        </Button>
        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
          Add Member & Process Payment
        </Button>
      </div>
    </form>
  );
};

export default AddMemberForm;
