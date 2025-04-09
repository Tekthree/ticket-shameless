/**
 * Stripe mock utilities for testing
 */

export const mockStripeElements = () => {
  const elementsMock = {
    create: jest.fn().mockReturnValue({
      mount: jest.fn(),
      unmount: jest.fn(),
      on: jest.fn(),
      update: jest.fn(),
    }),
    getElement: jest.fn(),
  };

  return {
    elements: jest.fn().mockReturnValue(elementsMock),
    confirmPayment: jest.fn(),
    confirmCardPayment: jest.fn(),
    createPaymentMethod: jest.fn(),
    retrievePaymentIntent: jest.fn(),
  };
};

export const mockStripePaymentResponse = (success = true, paymentIntentId = 'pi_test123') => {
  if (success) {
    return {
      paymentIntent: {
        id: paymentIntentId,
        status: 'succeeded',
        amount: 1000,
        currency: 'usd',
        client_secret: 'pi_test123_secret_test123',
      },
      error: undefined,
    };
  }
  
  return {
    paymentIntent: null,
    error: {
      type: 'card_error',
      message: 'Your card was declined.',
      code: 'card_declined',
    },
  };
};

export const mockStripePaymentMethodResponse = (success = true) => {
  if (success) {
    return {
      paymentMethod: {
        id: 'pm_test123',
        type: 'card',
        card: {
          brand: 'visa',
          last4: '4242',
          exp_month: 12,
          exp_year: 2025,
        },
        billing_details: {
          name: 'Test User',
          email: 'test@example.com',
        },
      },
      error: undefined,
    };
  }
  
  return {
    paymentMethod: null,
    error: {
      type: 'validation_error',
      message: 'Your card number is incomplete.',
      code: 'incomplete_number',
    },
  };
};
