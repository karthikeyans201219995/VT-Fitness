import React, { useState } from 'react';
import { mockGymSettings, mockTrainers } from '../../mockData';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { Building, Clock, Users, Plus, Edit, Trash2 } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';

const GymSettings = () => {
  const [settings, setSettings] = useState(mockGymSettings);
  const [trainers, setTrainers] = useState(mockTrainers);
  const { toast } = useToast();

  const handleSettingsChange = (e) => {
    setSettings({ ...settings, [e.target.name]: e.target.value });
  };

  const handleSaveSettings = (e) => {
    e.preventDefault();
    toast({
      title: "Settings Saved",
      description: "Gym settings have been updated successfully.",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Gym Settings</h1>
        <p className="text-gray-400">Manage gym information and configurations</p>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="bg-gray-900 border-gray-800">
          <TabsTrigger value="general" className="data-[state=active]:bg-blue-600">
            <Building className="mr-2 h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="hours" className="data-[state=active]:bg-blue-600">
            <Clock className="mr-2 h-4 w-4" />
            Operating Hours
          </TabsTrigger>
          <TabsTrigger value="trainers" className="data-[state=active]:bg-blue-600">
            <Users className="mr-2 h-4 w-4" />
            Trainers
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-6">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">General Information</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveSettings} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-gray-300">Gym Name</Label>
                  <Input
                    name="gymName"
                    value={settings.gymName}
                    onChange={handleSettingsChange}
                    className="bg-gray-800 border-gray-700 text-white"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-300">Email</Label>
                    <Input
                      name="email"
                      type="email"
                      value={settings.email}
                      onChange={handleSettingsChange}
                      className="bg-gray-800 border-gray-700 text-white"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-300">Phone</Label>
                    <Input
                      name="phone"
                      type="tel"
                      value={settings.phone}
                      onChange={handleSettingsChange}
                      className="bg-gray-800 border-gray-700 text-white"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Address</Label>
                  <Input
                    name="address"
                    value={settings.address}
                    onChange={handleSettingsChange}
                    className="bg-gray-800 border-gray-700 text-white"
                    required
                  />
                </div>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
                  Save Changes
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hours" className="mt-6">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Operating Hours</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveSettings} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-300">Opening Time</Label>
                    <Input
                      name="openingTime"
                      type="time"
                      value={settings.openingTime}
                      onChange={handleSettingsChange}
                      className="bg-gray-800 border-gray-700 text-white"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-300">Closing Time</Label>
                    <Input
                      name="closingTime"
                      type="time"
                      value={settings.closingTime}
                      onChange={handleSettingsChange}
                      className="bg-gray-800 border-gray-700 text-white"
                      required
                    />
                  </div>
                </div>
                <div className="bg-gray-800 rounded-lg p-4">
                  <h3 className="text-white font-semibold mb-3">Weekly Schedule</h3>
                  <div className="space-y-2">
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                      <div key={day} className="flex items-center justify-between py-2 border-b border-gray-700 last:border-0">
                        <span className="text-gray-300">{day}</span>
                        <span className="text-white font-medium">
                          {settings.openingTime} - {settings.closingTime}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
                  Save Changes
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trainers" className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-white">Manage Trainers</h2>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="mr-2 h-4 w-4" />
              Add Trainer
            </Button>
          </div>
          <div className="space-y-4">
            {trainers.map(trainer => (
              <Card key={trainer.id} className="bg-gray-900 border-gray-800 hover:border-blue-600 transition-all duration-200">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-white">{trainer.name}</h3>
                        <Badge className={trainer.status === 'active' ? 'bg-green-600' : 'bg-gray-600'}>
                          {trainer.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                        <div>
                          <span className="text-gray-400">Email: </span>
                          <span className="text-white">{trainer.email}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Phone: </span>
                          <span className="text-white">{trainer.phone}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Specialization: </span>
                          <span className="text-blue-400">{trainer.specialization}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" className="border-gray-700 text-white hover:bg-gray-700">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" className="border-gray-700 text-white hover:bg-gray-700">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GymSettings;
