/**
 * Service for handling contact enquiries
 */

export interface EnquiryFormData {
  name: string;
  email: string;
  subject?: string;
  message: string;
}

export interface EnquiryResponse {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Submit an enquiry form
 * TODO: Wire up to actual API endpoint
 */
export async function postEnquiry(
  data: EnquiryFormData
): Promise<EnquiryResponse> {
  try {
    // Validate required fields
    if (!data.name || !data.email || !data.message) {
      return {
        success: false,
        error: 'Please fill in all required fields',
      };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      return {
        success: false,
        error: 'Please enter a valid email address',
      };
    }

    // TODO: Replace with actual API call
    // Example:
    // const response = await fetch('https://api.hssspares.co.uk/enquiries', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify(data),
    // });
    // 
    // if (!response.ok) {
    //   throw new Error('Failed to submit enquiry');
    // }
    // 
    // return await response.json();

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Mock successful response
    console.log('Enquiry submitted:', data);
    return {
      success: true,
      message: 'Thank you for your enquiry. We will get back to you as soon as possible.',
    };
  } catch (error) {
    console.error('Error submitting enquiry:', error);
    return {
      success: false,
      error: 'Failed to submit enquiry. Please try again later.',
    };
  }
}

