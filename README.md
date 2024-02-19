# ZKPayment-Verification

- Minimalistic Payment verification using zk-SNARKs: This project is to demonstrate the payment verification using zk-SNARKs. The project is implemented using Hardhat, Solidity, and Circom.
- Users can create a payment request using `SECRET` vaiable and the recipient can verify the payment using zk-SNARKs without reveling the secret parameter.

## Usage

- Clone the repository
- Run `npm run prepare` in the project directory
- Install the project dependencies and prepare by `npm install` in the project directory
- Start Hardhat tests by `npx hardhat test` in the project directory

## Caution:

- The project is for educational purposes only. Do not use it in production.

## License

MIT License

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
