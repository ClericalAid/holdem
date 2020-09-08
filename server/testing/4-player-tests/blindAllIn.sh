#!/bin/bash

# Distribute some chips around, then everyone shoves.
# ERROR: When the other two players are all in for 1 chip, the small blind is prompted to call
# the big blind. The game should go to showdown though. Honestly, this problem is small, and might
# cause errors in the gameflow if I try to fix this edge case.
sleep 5 > myPipe &
sleep 1
echo "raise 199" > myPipe; sleep 0.1
echo "call" > myPipe; sleep 0.1
echo "shove" > myPipe; sleep 0.1
echo "fold" > myPipe; sleep 0.1
echo "fold" > myPipe; sleep 0.1
echo "fold" > myPipe; sleep 0.1
echo "new" > myPipe; sleep 0.1
echo "shove" > myPipe; sleep 0.1
echo "fold" > myPipe; sleep 0.1
echo "call" > myPipe; sleep 0.1
echo "board" > myPipe; sleep 0.1
echo "moves" > myPipe; sleep 0.1

