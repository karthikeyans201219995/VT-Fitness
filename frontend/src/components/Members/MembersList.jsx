import React, { useState, useEffect } from 'react';
import { membersAPI, plansAPI } from '../../services/api';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Search, Plus, Edit, Eye, Mail, Phone, Loader2, Key, Trash2, QrCode } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import AddMemberForm from './AddMemberForm';
import EditMemberForm from './EditMemberForm';
import MemberDetails from './MemberDetails';
import { useToast } from '../../hooks/use-toast';
import { useAuth } from '../../context/AuthContext';

const MembersList = () => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMember, setSelectedMember] = useState(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState(null);
  const [qrCodeData, setQrCodeData] = useState(null);
  const [loadingQR, setLoadingQR] = useState(false);
  const { toast } = useToast();
  const { isAdmin, isTrainer } = useAuth();

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const data = await membersAPI.getAll();
      setMembers(data || []);
    } catch (error) {
      console.error('Error fetching members:', error);
      toast({
        title: 'Error',
        description: 'Failed to load members',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredMembers = members.filter(member =>
    member.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.phone?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddMember = async (newMember) => {
    try {
      await membersAPI.create(newMember);
      toast({
        title: 'Success',
        description: 'Member added successfully',
      });
      setShowAddDialog(false);
      fetchMembers();
    } catch (error) {
      console.error('Add member error details:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to add member',
        variant: 'destructive',
      });
    }
  };

  const handleViewDetails = (member) => {
    setSelectedMember(member);
    setShowDetailsDialog(true);
  };

  const handleEditMember = (member) => {
    setSelectedMember(member);
    setShowEditDialog(true);
  };

  const handleUpdateMember = async (updatedData) => {
    try {
      await membersAPI.update(selectedMember.id, updatedData);
      toast({
        title: 'Success',
        description: 'Member updated successfully',
      });
      setShowEditDialog(false);
      fetchMembers();
    } catch (error) {
      console.error('Update member error details:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update member',
        variant: 'destructive',
      });
    }
  };

  const [loadingPassword, setLoadingPassword] = useState(false);
  const [memberPassword, setMemberPassword] = useState(null);

  const handleViewPassword = async (member) => {
    setSelectedMember(member);
    setMemberPassword(null);
    setShowPasswordDialog(true);
    setLoadingPassword(true);
    
    try {
      const passwordData = await membersAPI.getPassword(member.id);
      setMemberPassword(passwordData.password);
    } catch (error) {
      console.error('Error fetching password:', error);
      if (error.message && error.message.includes('404')) {
        setMemberPassword('NOT_STORED');
        toast({
          title: 'Password Not Stored',
          description: 'This member was created before password storage was enabled. Member can use "Forgot Password" to reset.',
          variant: 'default',
        });
      } else {
        toast({
          title: 'Error',
          description: error.message || 'Failed to retrieve password',
          variant: 'destructive',
        });
        setMemberPassword('ERROR');
      }
    } finally {
      setLoadingPassword(false);
    }
  };

  const handleViewQRCode = async (member) => {
    setSelectedMember(member);
    setQrCodeData(null);
    setShowQRDialog(true);
    setLoadingQR(true);
    
    try {
      const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
      const response = await fetch(`${API_BASE_URL}/api/qr-attendance/generate/${member.id}`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate QR code');
      }
      
      const data = await response.json();
      setQrCodeData(data);
    } catch (error) {
      console.error('Error fetching QR code:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load QR code',
        variant: 'destructive',
      });
      setShowQRDialog(false);
    } finally {
      setLoadingQR(false);
    }
  };

  const handleDownloadQR = () => {
    if (!qrCodeData || !qrCodeData.qr_image) return;
    
    // Create a download link
    const link = document.createElement('a');
    link.href = qrCodeData.qr_image;
    link.download = `${selectedMember.full_name}_QR_Code.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: 'Success',
      description: 'QR code downloaded successfully',
    });
  };

  const handleDeleteClick = (member) => {
    setMemberToDelete(member);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!memberToDelete) return;
    
    try {
      await membersAPI.delete(memberToDelete.id);
      toast({
        title: 'Success',
        description: 'Member deleted successfully',
      });
      setShowDeleteDialog(false);
      setMemberToDelete(null);
      fetchMembers();
    } catch (error) {
      console.error('Delete member error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete member',
        variant: 'destructive',
      });
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'active': return 'bg-green-600';
      case 'inactive': return 'bg-yellow-600';
      case 'expired': return 'bg-red-600';
      default: return 'bg-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Members Management</h1>
          <p className="text-gray-400">
            {isTrainer ? 'View gym members and their information' : 'Manage gym members and their subscriptions'}
          </p>
        </div>
        {isAdmin && (
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/50">
                <Plus className="mr-2 h-4 w-4" />
                Add Member
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-900 border-gray-800 max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-white">Add New Member</DialogTitle>
                <DialogDescription className="text-gray-400">
                  Fill in the member details below
                </DialogDescription>
              </DialogHeader>
              <AddMemberForm onSubmit={handleAddMember} onCancel={() => setShowAddDialog(false)} />
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
              <Input
                placeholder="Search by name, ID, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-blue-600"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredMembers.map((member) => (
              <div
                key={member.id}
                className="p-4 bg-gray-800 rounded-lg border border-gray-700 hover:border-blue-600 transition-all duration-200"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-white">{member.full_name}</h3>
                      <Badge className={getStatusColor(member.status)}>
                        {member.status}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                      <div className="flex items-center text-gray-400">
                        <Mail className="mr-2 h-4 w-4" />
                        {member.email}
                      </div>
                      <div className="flex items-center text-gray-400">
                        <Phone className="mr-2 h-4 w-4" />
                        {member.phone}
                      </div>
                    </div>
                    <div className="mt-2 flex items-center space-x-4 text-sm">
                      <span className="text-gray-400">
                        Start: <span className="text-white font-medium">{new Date(member.start_date).toLocaleDateString()}</span>
                      </span>
                      <span className="text-gray-400">
                        End: <span className="text-white font-medium">{new Date(member.end_date).toLocaleDateString()}</span>
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-gray-700 text-white hover:bg-gray-700"
                      onClick={() => handleViewDetails(member)}
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-gray-700 text-green-400 hover:bg-gray-700"
                      onClick={() => handleViewQRCode(member)}
                      title="View QR Code"
                    >
                      <QrCode className="h-4 w-4" />
                    </Button>
                    {isAdmin && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-gray-700 text-blue-400 hover:bg-gray-700"
                          onClick={() => handleViewPassword(member)}
                          title="View Login Credentials"
                        >
                          <Key className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-gray-700 text-white hover:bg-gray-700"
                          onClick={() => handleEditMember(member)}
                          title="Edit Member"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-gray-700 text-red-400 hover:bg-red-900"
                          onClick={() => handleDeleteClick(member)}
                          title="Delete Member"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          {filteredMembers.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              No members found matching your search.
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="bg-gray-900 border-gray-800 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Member</DialogTitle>
            <DialogDescription className="text-gray-400">
              Update member information below
            </DialogDescription>
          </DialogHeader>
          {selectedMember && (
            <EditMemberForm 
              member={selectedMember}
              onSubmit={handleUpdateMember} 
              onCancel={() => setShowEditDialog(false)} 
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="bg-gray-900 border-gray-800 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Login Credentials</DialogTitle>
            <DialogDescription className="text-gray-400">
              Member login information
            </DialogDescription>
          </DialogHeader>
          {selectedMember && (
            <div className="space-y-4">
              <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-gray-400">Member Name</label>
                    <p className="text-white font-medium">{selectedMember.full_name}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Email (Username)</label>
                    <p className="text-white font-medium">{selectedMember.email}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400">Password</label>
                    {loadingPassword ? (
                      <div className="flex items-center gap-2 text-gray-400 text-sm mt-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Retrieving password...</span>
                      </div>
                    ) : memberPassword === 'NOT_STORED' ? (
                      <div className="bg-yellow-900/20 border border-yellow-800 p-3 rounded mt-1">
                        <p className="text-yellow-400 text-sm">
                          ⚠️ Password not stored for this member
                        </p>
                        <p className="text-gray-400 text-xs mt-1">
                          This member was created before password storage was enabled. Member can use "Forgot Password" to reset their password.
                        </p>
                      </div>
                    ) : memberPassword && memberPassword !== 'ERROR' ? (
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-yellow-400 font-mono text-sm bg-gray-900 p-2 rounded flex-1 break-all">
                          {memberPassword}
                        </p>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-gray-700 text-white hover:bg-gray-700"
                          onClick={() => {
                            navigator.clipboard.writeText(memberPassword);
                            toast({ title: 'Copied!', description: 'Password copied to clipboard' });
                          }}
                        >
                          <Key className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <p className="text-red-400 text-sm bg-gray-900 p-2 rounded mt-1">
                        Failed to retrieve password
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      ⚠️ Keep this password secure. Member can use "Forgot Password" to reset if needed.
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <Button 
                  onClick={() => setShowPasswordDialog(false)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-gray-900 border-gray-800 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Delete Member</DialogTitle>
            <DialogDescription className="text-gray-400">
              Are you sure you want to delete this member?
            </DialogDescription>
          </DialogHeader>
          {memberToDelete && (
            <div className="space-y-4">
              <div className="bg-red-900/20 border border-red-800 p-4 rounded-lg">
                <p className="text-white font-medium mb-2">{memberToDelete.full_name}</p>
                <p className="text-gray-400 text-sm">{memberToDelete.email}</p>
                <p className="text-red-400 text-sm mt-3">
                  ⚠️ This action cannot be undone. All member data, payments, and attendance records will be permanently deleted.
                </p>
              </div>
              <div className="flex justify-end space-x-3">
                <Button 
                  variant="outline"
                  onClick={() => {
                    setShowDeleteDialog(false);
                    setMemberToDelete(null);
                  }}
                  className="border-gray-700 text-white hover:bg-gray-700"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleDeleteConfirm}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Delete Member
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="bg-gray-900 border-gray-800 max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-white">Member Details</DialogTitle>
          </DialogHeader>
          {selectedMember && <MemberDetails member={selectedMember} />}
        </DialogContent>
      </Dialog>

      {/* QR Code Dialog */}
      <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
        <DialogContent className="bg-gray-900 border-gray-800 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <QrCode className="h-5 w-5 text-green-500" />
              Member QR Code
            </DialogTitle>
          </DialogHeader>
          {selectedMember && (
            <div className="space-y-4">
              <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                <p className="text-sm text-gray-400 mb-2">Member Name</p>
                <p className="text-white font-medium text-lg">{selectedMember.full_name}</p>
              </div>

              {loadingQR ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
              ) : qrCodeData ? (
                <>
                  <div className="bg-white p-6 rounded-lg flex items-center justify-center">
                    <img 
                      src={qrCodeData.qr_image} 
                      alt="Member QR Code" 
                      className="w-64 h-64"
                    />
                  </div>
                  
                  <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                    <p className="text-sm text-gray-400 mb-2">QR Code Value</p>
                    <p className="text-white font-mono text-xs break-all">{qrCodeData.qr_code}</p>
                  </div>

                  <div className="bg-blue-900/20 border border-blue-800 p-3 rounded-lg">
                    <p className="text-blue-400 text-sm">
                      <strong>How to use:</strong> Member should scan this QR code at the gym entrance for automatic check-in/check-out.
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <Button 
                      onClick={handleDownloadQR}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      <QrCode className="h-4 w-4 mr-2" />
                      Download QR Code
                    </Button>
                    <Button 
                      onClick={() => window.print()}
                      variant="outline"
                      className="flex-1 border-gray-700 text-white hover:bg-gray-700"
                    >
                      Print
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-red-400">
                  Failed to load QR code
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MembersList;
