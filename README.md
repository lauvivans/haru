# hangman-game

This is a default hangman game built upon technologies such as WebRTC, Coturn and Signaling Server. 

## Architecture

<div align="center">
  <img src="/docs/assets/turn-stun-server.jpeg" alt="Explanation of Turn and Stun server in WebRTC" width="500px" />
</div>

### WebRTC (Web Real-Time Communication)

WebRTC is an open-source project maintained by companies like Google, Apple, Amazon, etc. that lets you add real-time communication capabilities to web and mobile applications. It supports video, voice, and generic data to be sent between peers. It's available on all modern browsers as well as on native clients for all major platforms.

Real-Time communications need low-latency (time it takes for data to travel from a device to a server and back), under 50ms for smooth, real-time activities, while over 100ms causes noticeable lag.

Follow this [code lab](https://codelabs.developers.google.com/codelabs/webrtc-web#0). 

[WebRTC](https://webrtc.org/).

#### Peer-to-peer

It's a distributed computing architecture in which participants share part of their own resources, such as processing power, storage, or network capacity.

Each computer can act as a server for the others, allowing shared access to files and peripherals without the need for a central server.

Differently from WebSockets that use a server as the center of communication, where the server has the responsibility to exchange data between clients, peer-to-peer can use a server only to establish connection. This server helps clients to find each other, called signaling server.

Peer connections in WebRTC specifications use peer-to-peer protocol to connect two applications on different computers to communicate with each other.

In order to discover how two peers can connect, both clients need to provide an **ICE Server configuration**. This is either a STUN or a TURN-server, and their role is to provide ICE candidates to each client which is then transferred to the remote peer. This transferring of ICE candidates is commonly called signaling.

<div align="center">
  <img src="/docs/assets/webrtc-vs-websockets.png" alt="Explanation of the difference between WebRTC and WebSockets" width="500px" />
</div>

[WebRTC - peer connections](https://webrtc.org/getting-started/peer-connections)

#### WebSockets

Two-way channels over a single, persistent TCP connection, enabling real-time, low latency data exchange between clients like web browsers and servers, unlike traditional HTTP’s request-response model, making them ideal for live chats, gaming and financial updates

WebSocket protocol supports SSL similar to how HTTP supports HTTPS, using wss:// to connect securely.

WebSockets are ideal for creating signaling server since it is reliable. Signals are less likely to get dropped between users, giving more successful connections. 

### Signaling server

<div align="center">
  <img src="/docs/assets/peer-to-peer-signaling.png" alt="Explanation of Peer-to-Peer connection with signaling server" width="500px" />
</div>

Connecting two WebRTC users.

#### Offer and callee

The user that initiates the signaling process creates an offer that includes a session description in SDP format. The user that is delivered is called callee. The callee responds to the offer with an answer message, also containing an SDP description.

##### Session Description Protocol (SDP)

The SDP is the standard describing a peer-to-peer connection. SDP contains the **codec**, **source address**, and **timing information** of audio and video. It is never used alone, but by protocols like RTP and RTSP. SDP is also a component of WebRTC, which uses SDP as a way of describing a session.

Example:

```jsx
v=0
o=alice 2890844526 2890844526 IN IP4 host.anywhere.com
s=
c=IN IP4 host.anywhere.com
t=0 0
m=audio 49170 RTP/AVP 0
a=rtpmap:0 PCMU/8000
m=video 51372 RTP/AVP 31
a=rtpmap:31 H261/90000
m=video 53000 RTP/AVP 32
a=rtpmap:32 MPV/90000
```

**Codec**

Codec stands for coder-decoder. It is a program, algorithm, or device that encodes or decodes a data stream. A given codec knows how to handle a specific encoding or compression technology. 

#### Interactive Connectivity Establishment (ICE)

#### Flow

The process starts with User A and User B registering themselves with the server. For this, we will need an ID that is unique. 

Once they have the ID and can make an offer, candidates are sent between clients until they can successfully make a connection. 

To leave the connection, the user can send a leave message. 

Follow this [tutorial](https://medium.com/@jamesbordane57/webrtc-signaling-server-how-it-works-build-one-node-js-or-skip-it-890e244d90ae)

### TURN-Server (Traversal Using Relays around NAT)

Unlike STUN servers, which assist in direct peer-to-peer connectivity, TURN servers relay data when direct connections fail. They ensure seamless connectivity, even in restrictive networks.

Follow the [tutorial](https://medium.com/@dushyantsom60/building-a-reliable-turn-server-on-azure-for-scalable-webrtc-applications-5183d646599a)

**Building a TURN-server with Coturn and EC2**

> EC2 stands for Elastic Compute Cloud. It offers more than 750 instances and a range of processors, storage, network, OS.

[AWS docs](https://docs.aws.amazon.com/)

1. The VM, our server in the cloud for hangman-game, exists on AWS EC2 instance. In this process, we create: 
  - Security groups that orchastrate the TCP and UDP connections later used to communicate with the turn server.
  - Also, an EIP (stands for Elastic IP), a static public IP provided by AWS.
  - A key pair to safely stablish SSH connection.
2. Later we can connect via Standard SSH Client (Windows, Linux, macOS), where there's a built-in SSH client via Terminal or PowerShell, EC2 Instance Connect (Browser-based), or PuTTY (older Windows versions). 
3. We install [Coturn TURN Server](https://github.com/coturn/coturn) and use command `turnserver` to open connection. Coturn is the actual software that works as the TURN server, handling the traffic relay between peers.

WebRTC gives us a page that can test our turn server availability:
[WebRTC Trickle ICE](https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/)

## References

[Signaling and video calling - Web APIs | MDN](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Signaling_and_video_calling)

[SDP - Glossary | MDN](https://developer.mozilla.org/en-US/docs/Glossary/SDP)

[The WebSocket API (WebSockets) - Web APIs | MDN](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)

[Build a Signaling Server for Simple-Peer](https://javascript.plainenglish.io/building-a-signaling-server-for-simple-peer-f92d754edc85)

[webrtc-books/2. Learning WebRTC.pdf at master · codeyu/webrtc-books](https://github.com/codeyu/webrtc-books/blob/master/2.%20Learning%20WebRTC.pdf)

[linux-doc.ru](https://linux-doc.ru/webrtc/book/webrtc_cookbook.pdf)

[www.voztovoice.org](https://www.voztovoice.org/sites/default/files/WEBRTC_BLUEPRINTS.pdf)

[webrtcforthecurious.com](https://webrtcforthecurious.com/docs/webrtc-for-the-curious.pdf)

https://github.com/lisajamhoury/simple-peer-server/blob/main/src/simple-peer-server.js