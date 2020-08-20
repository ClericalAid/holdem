#!/bin/bash

# Distribute some chips around, then everyone shoves.
sleep 10 > myPipe &
sleep 1
echo "raise 50" > myPipe; sleep 0.1
echo "raise 100" > myPipe; sleep 0.1
echo "shove" > myPipe; sleep 0.1
echo "fold" > myPipe; sleep 0.1
echo "fold" > myPipe; sleep 0.1
echo "fold" > myPipe; sleep 0.1
echo "board" > myPipe; sleep 0.1
echo "new" > myPipe; sleep 0.1
echo "shove" > myPipe; sleep 0.1
echo "shove" > myPipe; sleep 0.1
echo "shove" > myPipe; sleep 0.1
echo "shove" > myPipe; sleep 0.1
echo "board" > myPipe; sleep 0.1
echo "debug" > myPipe; sleep 0.1
