import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Heart, LogOut, User, Users, Building2, Activity } from 'lucide-react';
import { toast } from 'sonner';
import { API } from '@/App';

const organs = ['heart', 'kidney', 'liver', 'lungs', 'pancreas', 'intestines'];

const HospitalDashboard = ({ user, onLogout }) => {
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [donors, setDonors] = useState([]);
  const [recipients, setRecipients] = useState([]);
  const [matches, setMatches] = useState([]);
  const [selectedDonor, setSelectedDonor] = useState(null);
  const [selectedRecipient, setSelectedRecipient] = useState(null);
  const [selectedOrgan, setSelectedOrgan] = useState('');
  const [isMatchDialogOpen, setIsMatchDialogOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    hospital_name: '',
    location: '',
    contact_number: ''
  });

  useEffect(() => {
    fetchProfile();
    fetchDonors();
    fetchRecipients();
    fetchMatches();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await axios.get(`${API}/hospitals/me`);
      setProfile(response.data);
      setFormData({
        hospital_name: response.data.hospital_name,
        location: response.data.location,
        contact_number: response.data.contact_number
      });
    } catch (error) {
      if (error.response?.status === 404) {
        setIsEditing(true);
      }
    }
  };

  const fetchDonors = async () => {
    try {
      const response = await axios.get(`${API}/donors`);
      setDonors(response.data);
    } catch (error) {
      console.error('Failed to fetch donors:', error);
    }
  };

  const fetchRecipients = async () => {
    try {
      const response = await axios.get(`${API}/recipients`);
      setRecipients(response.data);
    } catch (error) {
      console.error('Failed to fetch recipients:', error);
    }
  };

  const fetchMatches = async () => {
    try {
      const response = await axios.get(`${API}/matches`);
      setMatches(response.data);
    } catch (error) {
      console.error('Failed to fetch matches:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await axios.post(`${API}/hospitals`, formData);
      toast.success('Profile created successfully!');
      setIsEditing(false);
      fetchProfile();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save profile');
    }
  };

  const openMatchDialog = (donor, recipient, organ) => {
    setSelectedDonor(donor);
    setSelectedRecipient(recipient);
    setSelectedOrgan(organ);
    setIsMatchDialogOpen(true);
  };

  const createMatch = async () => {
    try {
      await axios.post(`${API}/matches`, {
        donor_id: selectedDonor.id,
        recipient_id: selectedRecipient.id,
        organ_type: selectedOrgan
      });
      toast.success('Match created successfully!');
      setIsMatchDialogOpen(false);
      fetchMatches();
      fetchDonors();
      fetchRecipients();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create match');
    }
  };

  const getCompatiblePairs = () => {
    const pairs = [];
    
    donors.forEach(donor => {
      if (donor.status !== 'available') return;
      
      recipients.forEach(recipient => {
        if (recipient.status !== 'waiting') return;
        
        // Check blood compatibility
        const compatibility = {
          "O-": ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"],
          "O+": ["O+", "A+", "B+", "AB+"],
          "A-": ["A-", "A+", "AB-", "AB+"],
          "A+": ["A+", "AB+"],
          "B-": ["B-", "B+", "AB-", "AB+"],
          "B+": ["B+", "AB+"],
          "AB-": ["AB-", "AB+"],
          "AB+": ["AB+"]
        };
        
        const isCompatible = compatibility[donor.blood_type]?.includes(recipient.blood_type);
        if (!isCompatible) return;
        
        // Find matching organs
        const matchingOrgans = donor.organs_available.filter(organ => 
          recipient.organs_needed.includes(organ)
        );
        
        if (matchingOrgans.length > 0) {
          matchingOrgans.forEach(organ => {
            pairs.push({
              donor,
              recipient,
              organ,
              compatibility_score: donor.blood_type === recipient.blood_type ? 100 : 80
            });
          });
        }
      });
    });
    
    // Sort by urgency and compatibility
    pairs.sort((a, b) => {
      const urgencyOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const urgencyDiff = urgencyOrder[b.recipient.urgency_level] - urgencyOrder[a.recipient.urgency_level];
      if (urgencyDiff !== 0) return urgencyDiff;
      return b.compatibility_score - a.compatibility_score;
    });
    
    return pairs;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <Heart className="w-8 h-8 text-purple-600" />
              <span className="text-2xl font-bold text-gray-900">LifeLink</span>
              <Badge className="ml-2 bg-purple-100 text-purple-700 hover:bg-purple-100">Hospital</Badge>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-gray-600" />
                <span className="text-gray-700 font-medium">{user.name}</span>
              </div>
              <Button 
                variant="outline" 
                onClick={onLogout}
                className="border-gray-300"
                data-testid="logout-btn"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!profile || isEditing ? (
          <Card className="max-w-2xl mx-auto" data-testid="hospital-profile-card">
            <CardHeader>
              <CardTitle>Hospital Profile</CardTitle>
              <CardDescription>Complete your hospital profile to start coordinating</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Hospital Name</Label>
                  <Input
                    value={formData.hospital_name}
                    onChange={(e) => setFormData({ ...formData, hospital_name: e.target.value })}
                    required
                    placeholder="Enter hospital name"
                    data-testid="hospital-name-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Location</Label>
                  <Input
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    required
                    placeholder="City, State"
                    data-testid="location-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Contact Number</Label>
                  <Input
                    value={formData.contact_number}
                    onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
                    required
                    placeholder="+1 (555) 123-4567"
                    data-testid="contact-number-input"
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  data-testid="save-hospital-profile-btn"
                >
                  Save Profile
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Statistics */}
            <div className="grid md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
                      <Users className="w-6 h-6 text-teal-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{donors.length}</p>
                      <p className="text-sm text-gray-600">Total Donors</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <Activity className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{recipients.length}</p>
                      <p className="text-sm text-gray-600">Total Recipients</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                      <Heart className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{getCompatiblePairs().length}</p>
                      <p className="text-sm text-gray-600">Compatible Pairs</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{matches.length}</p>
                      <p className="text-sm text-gray-600">Total Matches</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            <Tabs defaultValue="matching" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="matching" data-testid="matching-tab">Matching</TabsTrigger>
                <TabsTrigger value="donors" data-testid="donors-tab">Donors</TabsTrigger>
                <TabsTrigger value="recipients" data-testid="recipients-tab">Recipients</TabsTrigger>
              </TabsList>

              <TabsContent value="matching">
                <Card data-testid="matching-card">
                  <CardHeader>
                    <CardTitle>Compatible Donor-Recipient Pairs</CardTitle>
                    <CardDescription>Sorted by urgency level and compatibility score</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {getCompatiblePairs().map((pair, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4 hover:border-purple-500 transition-colors">
                          <div className="flex justify-between items-start">
                            <div className="flex-1 grid md:grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm font-semibold text-teal-600 mb-2">DONOR</p>
                                <p className="text-sm">Blood Type: {pair.donor.blood_type}</p>
                                <p className="text-sm">Age: {pair.donor.age}</p>
                                <p className="text-sm capitalize">Organ: {pair.organ}</p>
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-blue-600 mb-2">RECIPIENT</p>
                                <p className="text-sm">Blood Type: {pair.recipient.blood_type}</p>
                                <p className="text-sm">Age: {pair.recipient.age}</p>
                                <Badge className={`
                                  ${pair.recipient.urgency_level === 'critical' ? 'bg-red-100 text-red-700' : ''}
                                  ${pair.recipient.urgency_level === 'high' ? 'bg-orange-100 text-orange-700' : ''}
                                  ${pair.recipient.urgency_level === 'medium' ? 'bg-yellow-100 text-yellow-700' : ''}
                                  ${pair.recipient.urgency_level === 'low' ? 'bg-green-100 text-green-700' : ''}
                                  hover:bg-current capitalize
                                `}>
                                  {pair.recipient.urgency_level}
                                </Badge>
                              </div>
                            </div>
                            <div className="text-right ml-4">
                              <p className="text-sm font-semibold text-purple-600 mb-2">{pair.compatibility_score}% Match</p>
                              <Button
                                size="sm"
                                className="bg-purple-600 hover:bg-purple-700"
                                onClick={() => openMatchDialog(pair.donor, pair.recipient, pair.organ)}
                                data-testid={`create-match-btn-${index}`}
                              >
                                Create Match
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {getCompatiblePairs().length === 0 && (
                      <p className="text-gray-500 text-center py-8">No compatible pairs found</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="donors">
                <Card data-testid="donors-list-card">
                  <CardHeader>
                    <CardTitle>All Donors</CardTitle>
                    <CardDescription>Complete list of registered donors</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {donors.map((donor) => (
                        <div key={donor.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between">
                            <div>
                              <p className="font-semibold">Blood Type: {donor.blood_type}</p>
                              <p className="text-sm text-gray-600">Age: {donor.age} years</p>
                              <div className="flex flex-wrap gap-1 mt-2">
                                {donor.organs_available.map(organ => (
                                  <Badge key={organ} variant="outline" className="text-xs capitalize">
                                    {organ}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <Badge className="bg-green-100 text-green-700 hover:bg-green-100 capitalize h-fit">
                              {donor.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                    {donors.length === 0 && (
                      <p className="text-gray-500 text-center py-8">No donors registered</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="recipients">
                <Card data-testid="recipients-list-card">
                  <CardHeader>
                    <CardTitle>All Recipients</CardTitle>
                    <CardDescription>Complete list of registered recipients</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {recipients.map((recipient) => (
                        <div key={recipient.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between">
                            <div>
                              <p className="font-semibold">Blood Type: {recipient.blood_type}</p>
                              <p className="text-sm text-gray-600">Age: {recipient.age} years</p>
                              <div className="flex flex-wrap gap-1 mt-2">
                                {recipient.organs_needed.map(organ => (
                                  <Badge key={organ} variant="outline" className="text-xs capitalize">
                                    {organ}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge className={`
                                ${recipient.urgency_level === 'critical' ? 'bg-red-100 text-red-700' : ''}
                                ${recipient.urgency_level === 'high' ? 'bg-orange-100 text-orange-700' : ''}
                                ${recipient.urgency_level === 'medium' ? 'bg-yellow-100 text-yellow-700' : ''}
                                ${recipient.urgency_level === 'low' ? 'bg-green-100 text-green-700' : ''}
                                hover:bg-current capitalize
                              `}>
                                {recipient.urgency_level}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {recipients.length === 0 && (
                      <p className="text-gray-500 text-center py-8">No recipients registered</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </main>

      {/* Match Creation Dialog */}
      <Dialog open={isMatchDialogOpen} onOpenChange={setIsMatchDialogOpen}>
        <DialogContent data-testid="match-dialog">
          <DialogHeader>
            <DialogTitle>Create Match</DialogTitle>
            <DialogDescription>
              Confirm the creation of this organ match
            </DialogDescription>
          </DialogHeader>
          {selectedDonor && selectedRecipient && (
            <div className="space-y-4">
              <div>
                <p className="font-semibold mb-2">Donor Information:</p>
                <p className="text-sm">Blood Type: {selectedDonor.blood_type}</p>
                <p className="text-sm">Age: {selectedDonor.age}</p>
              </div>
              <div>
                <p className="font-semibold mb-2">Recipient Information:</p>
                <p className="text-sm">Blood Type: {selectedRecipient.blood_type}</p>
                <p className="text-sm">Age: {selectedRecipient.age}</p>
                <p className="text-sm capitalize">Urgency: {selectedRecipient.urgency_level}</p>
              </div>
              <div>
                <p className="font-semibold mb-2">Organ:</p>
                <Badge className="capitalize">{selectedOrgan}</Badge>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={createMatch} 
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                  data-testid="confirm-match-btn"
                >
                  Confirm Match
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsMatchDialogOpen(false)}
                  data-testid="cancel-match-btn"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HospitalDashboard;