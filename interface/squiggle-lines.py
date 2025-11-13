import numpy as np
import random
import matplotlib.pyplot as plt

lngth = 15

pnts = lngth * 100

colors = ['#FFC019', '#FF9000', '#E8B429', '#F28D0A', '#E8B429', '#E3A60A', '#F28D0A']

for i in range(10):
    plt.clf()
    col = colors[np.random.randint(0, len(colors))];
    # Example squiggly line (random noise or actual audio data)
    x = np.linspace(0, lngth, pnts)
    x_noisy = x + (0.05 * np.random.randn(len(x)))
    # y = np.sin(5*x) + 0.2*np.random.randn(1000)
    y = np.sin(5*x_noisy) + 0.2*np.random.randn(pnts)

    plt.plot(x, y, color=col, linewidth=0.2)
    plt.axis('off')
    plt.savefig("interface/waveform" + str(i) + ".svg", bbox_inches='tight', pad_inches=0)

