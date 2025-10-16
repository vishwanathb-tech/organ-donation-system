import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Heart, Users, Building2, Activity, CheckCircle2, Clock } from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 via-white to-teal-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <Heart className="w-8 h-8 text-teal-600" />
              <span className="text-2xl font-bold text-gray-900">LifeLink</span>
            </div>
            <Button 
              onClick={() => navigate('/auth')} 
              className="bg-teal-600 hover:bg-teal-700 text-white"
              data-testid="nav-get-started-btn"
            >
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-20 pb-16 px-4" data-testid="hero-section">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Connecting Lives Through
            <span className="block text-teal-600 mt-2">Organ Donation</span>
          </h1>
          <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
            A comprehensive platform bridging donors, recipients, and medical facilities to save lives through efficient organ matching and coordination.
          </p>
          <Button 
            onClick={() => navigate('/auth')} 
            size="lg" 
            className="bg-teal-600 hover:bg-teal-700 text-white text-lg px-8 py-6 rounded-full shadow-lg hover:shadow-xl transition-all"
            data-testid="hero-get-started-btn"
          >
            Join LifeLink Today
          </Button>
        </div>
      </section>

      {/* User Types Section */}
      <section className="py-16 px-4 bg-white" data-testid="user-types-section">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-4">
            Who Can Use LifeLink?
          </h2>
          <p className="text-center text-gray-600 mb-12 text-lg">Choose your role and make a difference</p>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-2 border-gray-100 hover:border-teal-500 hover:shadow-lg transition-all">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-8 h-8 text-teal-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Organ Donors</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Register as a donor and give the gift of life. Your decision can save multiple lives.
                </p>
                <ul className="text-left text-gray-700 space-y-2 mb-6">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-teal-600 mt-0.5 flex-shrink-0" />
                    <span>Register organ availability</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-teal-600 mt-0.5 flex-shrink-0" />
                    <span>View potential recipients</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-teal-600 mt-0.5 flex-shrink-0" />
                    <span>Track donation status</span>
                  </li>
                </ul>
                <Button 
                  onClick={() => navigate('/auth')} 
                  variant="outline" 
                  className="w-full border-teal-600 text-teal-600 hover:bg-teal-50"
                  data-testid="donor-register-btn"
                >
                  Register as Donor
                </Button>
              </CardContent>
            </Card>

            <Card className="border-2 border-gray-100 hover:border-teal-500 hover:shadow-lg transition-all">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Recipients</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Find hope through our matching system. Connect with compatible donors efficiently.
                </p>
                <ul className="text-left text-gray-700 space-y-2 mb-6">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span>List organ requirements</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span>View compatible donors</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span>Set urgency levels</span>
                  </li>
                </ul>
                <Button 
                  onClick={() => navigate('/auth')} 
                  variant="outline" 
                  className="w-full border-blue-600 text-blue-600 hover:bg-blue-50"
                  data-testid="recipient-register-btn"
                >
                  Register as Recipient
                </Button>
              </CardContent>
            </Card>

            <Card className="border-2 border-gray-100 hover:border-teal-500 hover:shadow-lg transition-all">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Building2 className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Hospitals</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Manage and coordinate organ transplants with our comprehensive dashboard.
                </p>
                <ul className="text-left text-gray-700 space-y-2 mb-6">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                    <span>Access full donor database</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                    <span>Create organ matches</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                    <span>Manage transplant processes</span>
                  </li>
                </ul>
                <Button 
                  onClick={() => navigate('/auth')} 
                  variant="outline" 
                  className="w-full border-purple-600 text-purple-600 hover:bg-purple-50"
                  data-testid="hospital-register-btn"
                >
                  Register as Hospital
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4" data-testid="features-section">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">
            Platform Features
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Activity className="w-6 h-6 text-teal-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Smart Matching Algorithm</h3>
                <p className="text-gray-600 leading-relaxed">
                  Our advanced system matches donors and recipients based on blood type compatibility and organ requirements, ensuring the highest success rates.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Real-time Updates</h3>
                <p className="text-gray-600 leading-relaxed">
                  Get instant notifications about potential matches and status changes, ensuring time-critical decisions are made promptly.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Verified Profiles</h3>
                <p className="text-gray-600 leading-relaxed">
                  All users undergo verification to maintain platform integrity and ensure authentic connections between donors and recipients.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Users className="w-6 h-6 text-teal-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Comprehensive Dashboard</h3>
                <p className="text-gray-600 leading-relaxed">
                  Intuitive dashboards for all user types provide easy access to relevant information and actions specific to your role.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-teal-600" data-testid="cta-section">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Save Lives?
          </h2>
          <p className="text-xl text-teal-50 mb-8">
            Join thousands of donors, recipients, and medical professionals making a difference.
          </p>
          <Button 
            onClick={() => navigate('/auth')} 
            size="lg" 
            className="bg-white text-teal-600 hover:bg-gray-100 text-lg px-8 py-6 rounded-full shadow-lg"
            data-testid="cta-get-started-btn"
          >
            Get Started Now
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Heart className="w-6 h-6 text-teal-600" />
            <span className="text-xl font-bold text-white">LifeLink</span>
          </div>
          <p className="text-sm">© 2025 LifeLink. Connecting lives through organ donation.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;